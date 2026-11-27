from flask import Flask, jsonify, request, session
from storage import read_data, write_data
import os
import re
from datetime import timedelta
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash, check_password_hash

# Load the values in .env into os.environ
load_dotenv()


# Point Flask to public/, one folder up from server/
# Serve pages at /login.html, not /static/login.html
app = Flask(__name__, static_folder="../public", static_url_path="")

# Sign the session cookie with the secret key from .env
app.secret_key = os.environ.get("SECRET_KEY")

# Stop the server if the key is missing
if not app.secret_key:
    raise RuntimeError("SECRET_KEY is missing: add it to .env")

# Expire a login cookie after 8 hours
app.permanent_session_lifetime = timedelta(hours=8)

# Send the landing page (index.html) for the home address "/"
@app.route("/")
def home():
    return app.send_static_file("index.html")


# Return a household's medications, appointments or doctors
def items_for(name, household_id):
    items = []
    for item in read_data(name):
        if item["householdId"] == household_id:
            items.append(item)
    return items


# Return the household with this id, or None if there isn't one
def find_household(household_id):
    for household in read_data("households"):
        if household["id"] == household_id:
            return household
    return None


# Return the logged-in manager's id, or None
def current_manager_id():
    return session.get("manager_id")


# Send the logged-in manager's id and first name
@app.route("/api/me")
def me():
    manager_id = current_manager_id()
    for m in read_data("managers"):
        if m["id"] == manager_id:
            return jsonify({"id": m["id"], "firstName": m["firstName"]})
    return jsonify({"error": "Log in first"}), 401


# Send one household with its managers, medications, appointments and doctors
@app.route("/api/households/<household_id>")
def get_household(household_id):
    manager_id = current_manager_id()
    if manager_id is None:
        return jsonify({"error": "Log in first"}), 401

    household = find_household(household_id)
    if household is None:
        return jsonify({"error": "Household not found"}), 404

    # Copy only safe fields (never the password hash)
    managers = []
    for m in read_data("managers"):
        if m["id"] in household["managerIds"]:
            managers.append({"id": m["id"], "firstName": m["firstName"], "email": m["email"]})

    return jsonify({
        "household": household,
        "managers": managers,
        "medications": items_for("medications", household_id),
        "appointments": items_for("appointments", household_id),
        "doctors": items_for("doctors", household_id),
    })


# Send the logged-in manager's households (id and name only)
@app.route("/api/households")
def list_households():
    manager_id = current_manager_id()
    if manager_id is None:
        return jsonify({"error": "Log in first"}), 401

    my_households = []
    for h in read_data("households"):
        if manager_id in h["managerIds"]:
            my_households.append({"id": h["id"], "name": h["name"]})
    return jsonify(my_households)


# Match the same email shape as the front end: name@site.domain
EMAIL_PATTERN = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"


# Return a trimmed text field, or "" if missing or not text
def text_field(body, name):
    value = body.get(name)
    if not isinstance(value, str):
        return ""
    return value.strip()


# Return the next free id ("m8" when the highest is "m7")
def next_id(items, prefix):
    highest = 0
    for item in items:
        number = int(item["id"][len(prefix):])
        if number > highest:
            highest = number
    return prefix + str(highest + 1)


# Create a manager account with a hashed password
@app.route("/api/register", methods=["POST"])
def register():
    # Refuse a body that isn't JSON, instead of crashing
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Send the form as JSON"}), 400

    first_name = text_field(body, "firstName")
    email = text_field(body, "email").lower()
    password = body.get("password")
    confirm = body.get("confirmPassword")

    # Repeat the front-end checks (requests can skip the browser)
    if first_name == "" or len(first_name) > 50:
        return jsonify({"error": "Enter a first name (50 characters max)"}), 400
    if not re.match(EMAIL_PATTERN, email) or len(email) > 100:
        return jsonify({"error": "Enter a correct email"}), 400
    if not isinstance(password, str) or len(password) < 8 or len(password) > 128:
        return jsonify({"error": "Use a password of 8 to 128 characters"}), 400
    if password != confirm:
        return jsonify({"error": "The passwords don't match"}), 400

    # Refuse an email that already has an account
    managers = read_data("managers")
    for m in managers:
        if m["email"].lower() == email:
            return jsonify({"error": "An account with this email already exists"}), 409

    # Save only the hash, never the password itself
    new_manager = {
        "id": next_id(managers, "m"),
        "firstName": first_name,
        "email": email,
        "passwordHash": generate_password_hash(password),
    }
    managers.append(new_manager)
    write_data("managers", managers)

    return jsonify({"id": new_manager["id"], "firstName": first_name}), 201


# Log a manager in by checking their password
@app.route("/api/login", methods=["POST"])
def login():
    # Refuse a body that isn't JSON, instead of crashing
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Send the form as JSON"}), 400

    email = text_field(body, "email").lower()
    password = body.get("password")
    if email == "" or not isinstance(password, str) or password == "":
        return jsonify({"error": "Enter your email and password"}), 400

    # Find the manager with this email
    manager = None
    for m in read_data("managers"):
        if m["email"].lower() == email:
            manager = m

    # Refuse an unknown email, or an account without a password
    if manager is None or "passwordHash" not in manager:
        return jsonify({"error": "No account with this email"}), 401
    if not check_password_hash(manager["passwordHash"], password):
        return jsonify({"error": "Wrong password"}), 401

    # Start a fresh session, then store this manager's id in the session cookie
    session.clear()
    session["manager_id"] = manager["id"]
    return jsonify({"id": manager["id"], "firstName": manager["firstName"]})


# Log out by emptying the session cookie
@app.route("/api/logout", methods=["POST"])
def logout():
    session.clear()
    return jsonify({"message": "Logged out"})


# Create a household with the logged-in manager in it
@app.route("/api/households", methods=["POST"])
def create_household():
    manager_id = current_manager_id()
    if manager_id is None:
        return jsonify({"error": "Log in first"}), 401

    # Refuse a body that isn't JSON, instead of crashing
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Send the form as JSON"}), 400

    name = text_field(body, "name")
    if name == "" or len(name) > 50:
        return jsonify({"error": "Enter a household name (50 characters max)"}), 400

    # Allow one household, unless you're on the Extended plan
    households = read_data("households")
    for h in households:
        if manager_id in h["managerIds"] and h["plan"] != "extended":
            return jsonify({"error": "Your plan includes one household"}), 403

    new_household = {
        "id": next_id(households, "h"),
        "name": name,
        "plan": "economic",
        "managerIds": [manager_id],
        "dependents": [],
    }
    households.append(new_household)
    write_data("households", households)
    return jsonify({"id": new_household["id"], "name": name}), 201


# Start the server only when this file is run directly
if __name__ == "__main__":
    app.run(debug=True)   # Debug on for local work only (off in Backend 4/4)
