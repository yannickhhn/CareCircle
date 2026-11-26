from flask import Flask, jsonify, request
from storage import read_data, write_data
import os
import re
from dotenv import load_dotenv
from werkzeug.security import generate_password_hash

# Load the values in .env into os.environ
load_dotenv()


# Point Flask to public/, one folder up from server/
# Serve the pages from the site root: /login.html, not /static/login.html
app = Flask(__name__, static_folder="../public", static_url_path="")

# Sign the session cookie with the secret key from .env
app.secret_key = os.environ.get("SECRET_KEY")

# Stop the server if the key is missing, instead of running without one
if not app.secret_key:
    raise RuntimeError("SECRET_KEY is missing: add it to .env")

# Send the landing page (index.html) for the home address "/"
@app.route("/")
def home():
    return app.send_static_file("index.html")


# Return every item (medication, appointment, doctor) that belongs to one household
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


@app.route("/api/households/<household_id>")
def get_household(household_id):
    household = find_household(household_id)
    if household is None:
        return jsonify({"error": "Household not found"}), 404

    # Copy only this household's managers, and only the fields the page shows
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


# Send the households the manager belongs to (id and name only, for the dropdown)
# Temporary: read the manager from ?manager= until login replaces it in Backend 2/4
@app.route("/api/households")
def list_households():
    manager_id = request.args.get("manager")
    my_households = []
    for h in read_data("households"):
        if manager_id in h["managerIds"]:
            my_households.append({"id": h["id"], "name": h["name"]})
    return jsonify(my_households)


# Match the same email shape as the front end: name@site.domain
EMAIL_PATTERN = r"^[^\s@]+@[^\s@]+\.[^\s@]+$"


# Return a text field from the request body, trimmed, or "" if it's missing or not text
def text_field(body, name):
    value = body.get(name)
    if not isinstance(value, str):
        return ""
    return value.strip()


# Return the next free manager id ("m8" when the highest is "m7")
def next_manager_id(managers):
    highest = 0
    for m in managers:
        number = int(m["id"][1:])
        if number > highest:
            highest = number
    return "m" + str(highest + 1)


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

    # Repeat every front-end check, since a request can skip the browser
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
        "id": next_manager_id(managers),
        "firstName": first_name,
        "email": email,
        "passwordHash": generate_password_hash(password),
    }
    managers.append(new_manager)
    write_data("managers", managers)

    return jsonify({"id": new_manager["id"], "firstName": first_name}), 201


# Start the server only when this file is run directly (python server/app.py)
if __name__ == "__main__":
    app.run(debug=True)   # Keep debug on for local work only; turn it off in Backend 4/4
