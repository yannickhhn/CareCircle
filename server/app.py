from flask import Flask, jsonify, request
from storage import read_data
import os
from dotenv import load_dotenv

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


# Start the server only when this file is run directly (python server/app.py)
if __name__ == "__main__":
    app.run(debug=True)   # Keep debug on for local work only; turn it off in Backend 4/4
