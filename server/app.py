from flask import Flask, jsonify, request, session
from storage import read_data, write_data
import os
import re
from datetime import date, datetime, timedelta
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


# Return True if the manager belongs to this household
def is_member(household, manager_id):
    return manager_id in household["managerIds"]


# Return the household if the logged-in manager belongs to it, or an error response
def load_my_household(household_id):
    manager_id = current_manager_id()
    if manager_id is None:
        return None, (jsonify({"error": "Log in first"}), 401)

    household = find_household(household_id)
    if household is None:
        return None, (jsonify({"error": "Household not found"}), 404)

    if not is_member(household, manager_id):
        return None, (jsonify({"error": "You don't have access to this household"}), 403)

    return household, None


# Send one household with its managers, medications, appointments and doctors
@app.route("/api/households/<household_id>")
def get_household(household_id):
    household, error = load_my_household(household_id)
    if error:
        return error

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


# Match a 24-hour time like "08:00" or "21:30"
TIME_PATTERN = r"^([01]\d|2[0-3]):[0-5]\d$"

# Match a date like "2026-12-01"
DATE_PATTERN = r"^\d{4}-\d{2}-\d{2}$"

REPEATS = ["daily", "weekly", "none"]


# Return True if the dependent belongs to this household
def has_dependent(household, dependent_id):
    for d in household["dependents"]:
        if d["id"] == dependent_id:
            return True
    return False


# Add a medication for one of the household's dependents
@app.route("/api/households/<household_id>/medications", methods=["POST"])
def add_medication(household_id):
    household, error = load_my_household(household_id)
    if error:
        return error

    # Refuse a body that isn't JSON, instead of crashing
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Send the form as JSON"}), 400

    dependent_id = text_field(body, "dependentId")
    name = text_field(body, "name")
    dose = text_field(body, "dose")
    times = body.get("times")
    repeat = text_field(body, "repeat")
    end_date = text_field(body, "endDate")
    note = text_field(body, "note")

    # Repeat the front-end checks (requests can skip the browser)
    if not has_dependent(household, dependent_id):
        return jsonify({"error": "Choose someone from this household"}), 400
    if name == "" or len(name) > 60:
        return jsonify({"error": "Enter a medication name (60 characters max)"}), 400
    if dose == "" or len(dose) > 30:
        return jsonify({"error": "Enter a dose (30 characters max)"}), 400
    # Allow 1 to 4 different times a day, each like 08:00
    if not isinstance(times, list) or len(times) < 1 or len(times) > 4:
        return jsonify({"error": "Choose 1 to 4 times a day"}), 400
    for t in times:
        if not isinstance(t, str) or not re.match(TIME_PATTERN, t):
            return jsonify({"error": "Enter times like 08:00"}), 400
    if len(set(times)) != len(times):
        return jsonify({"error": "Use a different time for each dose"}), 400
    if repeat not in REPEATS:
        return jsonify({"error": "Choose how often it repeats"}), 400
    # Allow no end date, or a real date from today on
    if end_date != "" and (not re.match(DATE_PATTERN, end_date) or end_date < date.today().isoformat()):
        return jsonify({"error": "Choose an end date from today on"}), 400
    if len(note) > 200:
        return jsonify({"error": "Keep the note under 200 characters"}), 400

    medications = read_data("medications")
    new_med = {
        "id": next_id(medications, "med"),
        "householdId": household_id,
        "dependentId": dependent_id,
        "name": name,
        "dose": dose,
        "times": sorted(times),
        "repeat": repeat,
        "endDate": end_date or None,
        "note": note,
        "given": [],
    }
    medications.append(new_med)
    write_data("medications", medications)
    return jsonify(new_med), 201


# Delete one of the household's medications
@app.route("/api/households/<household_id>/medications/<med_id>", methods=["DELETE"])
def delete_medication(household_id, med_id):
    household, error = load_my_household(household_id)
    if error:
        return error

    if not remove_item("medications", household_id, med_id):
        return jsonify({"error": "Medication not found"}), 404
    return jsonify({"message": "Deleted"})


# Remove an item from a data file, only if it's in this household; return True if removed
def remove_item(name, household_id, item_id):
    items = read_data(name)
    kept = []
    found = False
    for item in items:
        if item["id"] == item_id and item["householdId"] == household_id:
            found = True
        else:
            kept.append(item)
    if found:
        write_data(name, kept)
    return found


# Add an appointment for one of the household's dependents
@app.route("/api/households/<household_id>/appointments", methods=["POST"])
def add_appointment(household_id):
    household, error = load_my_household(household_id)
    if error:
        return error

    # Refuse a body that isn't JSON, instead of crashing
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Send the form as JSON"}), 400

    dependent_id = text_field(body, "dependentId")
    reason = text_field(body, "reason")
    day = text_field(body, "date")
    time = text_field(body, "time")
    address = text_field(body, "address")
    notes_text = text_field(body, "notes")

    # Repeat the front-end checks (requests can skip the browser)
    if not has_dependent(household, dependent_id):
        return jsonify({"error": "Choose someone from this household"}), 400
    if reason == "" or len(reason) > 60:
        return jsonify({"error": "Enter a reason (60 characters max)"}), 400
    if not re.match(DATE_PATTERN, day) or day < date.today().isoformat():
        return jsonify({"error": "Choose a date from today on"}), 400
    if not re.match(TIME_PATTERN, time):
        return jsonify({"error": "Enter a time like 08:00"}), 400
    if address == "" or len(address) > 120:
        return jsonify({"error": "Enter an address (120 characters max)"}), 400
    if len(notes_text) > 300:
        return jsonify({"error": "Keep the notes under 300 characters"}), 400

    # Turn the notes into one item per non-empty line
    notes = []
    for line in notes_text.split("\n"):
        if line.strip() != "":
            notes.append(line.strip())

    appointments = read_data("appointments")
    new_appt = {
        "id": next_id(appointments, "a"),
        "householdId": household_id,
        "dependentId": dependent_id,
        "reason": reason,
        "date": day,
        "time": time,
        "address": address,
        "notes": notes,
    }
    appointments.append(new_appt)
    write_data("appointments", appointments)
    return jsonify(new_appt), 201


# Delete one of the household's appointments
@app.route("/api/households/<household_id>/appointments/<appt_id>", methods=["DELETE"])
def delete_appointment(household_id, appt_id):
    household, error = load_my_household(household_id)
    if error:
        return error

    if not remove_item("appointments", household_id, appt_id):
        return jsonify({"error": "Appointment not found"}), 404
    return jsonify({"message": "Deleted"})


# Return this household's medication from the list, or None
def find_medication(medications, household_id, med_id):
    for med in medications:
        if med["id"] == med_id and med["householdId"] == household_id:
            return med
    return None


# Return the doses of a medication given today
def given_today(med, today):
    doses = []
    for dose in med["given"]:
        if dose["date"] == today:
            doses.append(dose)
    return doses


# Give the next dose of today, recorded as the logged-in manager
@app.route("/api/households/<household_id>/medications/<med_id>/given", methods=["POST"])
def give_dose(household_id, med_id):
    household, error = load_my_household(household_id)
    if error:
        return error

    medications = read_data("medications")
    med = find_medication(medications, household_id, med_id)
    if med is None:
        return jsonify({"error": "Medication not found"}), 404

    # Refuse a body that isn't JSON, instead of crashing
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Send the form as JSON"}), 400

    now = datetime.now()
    today = now.date().isoformat()
    doses = given_today(med, today)

    # Refuse if this isn't the next dose (another manager may have just given it)
    if len(doses) >= len(med["times"]) or text_field(body, "time") != med["times"][len(doses)]:
        return jsonify({"error": "This dose was already given. Reload to see the latest."}), 409

    med["given"].append({
        "date": today,
        "time": med["times"][len(doses)],
        "by": current_manager_id(),
        "at": now.strftime("%H:%M"),
    })
    write_data("medications", medications)
    return jsonify(med)


# Undo the last dose given today
@app.route("/api/households/<household_id>/medications/<med_id>/given", methods=["DELETE"])
def undo_dose(household_id, med_id):
    household, error = load_my_household(household_id)
    if error:
        return error

    medications = read_data("medications")
    med = find_medication(medications, household_id, med_id)
    if med is None:
        return jsonify({"error": "Medication not found"}), 404

    # Refuse if there's nothing to undo today
    doses = given_today(med, date.today().isoformat())
    if len(doses) == 0:
        return jsonify({"error": "No dose to undo today"}), 409

    med["given"].remove(doses[-1])
    write_data("medications", medications)
    return jsonify(med)


# Match a phone number like "514-555-0101" or "+1 (514) 555 0101"
PHONE_PATTERN = r"^[\d\s()+-]{7,20}$"


# Add a doctor card for one of the household's dependents
@app.route("/api/households/<household_id>/doctors", methods=["POST"])
def add_doctor(household_id):
    household, error = load_my_household(household_id)
    if error:
        return error

    # Refuse a body that isn't JSON, instead of crashing
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Send the form as JSON"}), 400

    dependent_id = text_field(body, "dependentId")
    name = text_field(body, "name")
    role = text_field(body, "role")
    phone = text_field(body, "phone")
    email = text_field(body, "email").lower()
    address = text_field(body, "address")

    # Repeat the front-end checks (requests can skip the browser)
    if not has_dependent(household, dependent_id):
        return jsonify({"error": "Choose someone from this household"}), 400
    if name == "" or len(name) > 60:
        return jsonify({"error": "Enter the doctor's name (60 characters max)"}), 400
    if role == "" or len(role) > 40:
        return jsonify({"error": "Enter their role (40 characters max)"}), 400
    if not re.match(PHONE_PATTERN, phone):
        return jsonify({"error": "Enter a phone number like 514-555-0101"}), 400
    # Allow no email, or a real one
    if email != "" and (not re.match(EMAIL_PATTERN, email) or len(email) > 100):
        return jsonify({"error": "Enter an email like name@example.com"}), 400
    if address == "" or len(address) > 120:
        return jsonify({"error": "Enter an address (120 characters max)"}), 400

    doctors = read_data("doctors")
    new_doctor = {
        "id": next_id(doctors, "doc"),
        "householdId": household_id,
        "dependentId": dependent_id,
        "name": name,
        "role": role,
        "email": email,
        "phone": phone,
        "address": address,
    }
    doctors.append(new_doctor)
    write_data("doctors", doctors)
    return jsonify(new_doctor), 201


# Delete one of the household's doctor cards
@app.route("/api/households/<household_id>/doctors/<doctor_id>", methods=["DELETE"])
def delete_doctor(household_id, doctor_id):
    household, error = load_my_household(household_id)
    if error:
        return error

    if not remove_item("doctors", household_id, doctor_id):
        return jsonify({"error": "Doctor not found"}), 404
    return jsonify({"message": "Deleted"})


PLAN_LIMITS = {"economic": 4, "familial": 8, "extended": None}


# Replace this household in households.json with the updated copy
def save_household(household):
    households = read_data("households")
    for i in range(len(households)):
        if households[i]["id"] == household["id"]:
            households[i] = household
    write_data("households", households)


# Return a dependent of this household, or None
def find_dependent(household, dependent_id):
    for d in household["dependents"]:
        if d["id"] == dependent_id:
            return d
    return None


# Return the dependent's fields from the request, or an error message
def read_dependent(body):
    name = text_field(body, "name")
    year = text_field(body, "birthYear")
    notes = text_field(body, "notes")
    this_year = date.today().year
    if name == "" or len(name) > 40:
        return None, "Enter a name (40 characters max)"
    if not year.isdigit() or int(year) < 1900 or int(year) > this_year:
        return None, "Enter a birth year between 1900 and " + str(this_year)
    if len(notes) > 200:
        return None, "Keep the notes under 200 characters"
    return {"name": name, "birthYear": int(year), "notes": notes}, None


# Add a dependent to the household, within the plan's member limit
@app.route("/api/households/<household_id>/dependents", methods=["POST"])
def add_dependent(household_id):
    household, error = load_my_household(household_id)
    if error:
        return error

    # Refuse a body that isn't JSON, instead of crashing
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Send the form as JSON"}), 400

    fields, message = read_dependent(body)
    if message:
        return jsonify({"error": message}), 400

    # Refuse a new member if the plan is full
    limit = PLAN_LIMITS[household["plan"]]
    members = len(household["managerIds"]) + len(household["dependents"])
    if limit is not None and members >= limit:
        return jsonify({"error": "Your plan is full (" + str(limit) + " members)"}), 403

    # Number dependents across all households, since their ids are unique app-wide
    all_dependents = []
    for h in read_data("households"):
        all_dependents.extend(h["dependents"])

    dependent = {"id": next_id(all_dependents, "d")}
    dependent.update(fields)
    household["dependents"].append(dependent)
    save_household(household)
    return jsonify(dependent), 201


# Change one of the household's dependents
@app.route("/api/households/<household_id>/dependents/<dependent_id>", methods=["PUT"])
def edit_dependent(household_id, dependent_id):
    household, error = load_my_household(household_id)
    if error:
        return error

    dependent = find_dependent(household, dependent_id)
    if dependent is None:
        return jsonify({"error": "Dependent not found"}), 404

    # Refuse a body that isn't JSON, instead of crashing
    body = request.get_json(silent=True)
    if not isinstance(body, dict):
        return jsonify({"error": "Send the form as JSON"}), 400

    fields, message = read_dependent(body)
    if message:
        return jsonify({"error": message}), 400

    dependent.update(fields)
    save_household(household)
    return jsonify(dependent)


# Return True if any medication, appointment or doctor belongs to this dependent
def has_items(dependent_id):
    for name in ["medications", "appointments", "doctors"]:
        for item in read_data(name):
            if item["dependentId"] == dependent_id:
                return True
    return False


# Remove a dependent, only once they have no items left
@app.route("/api/households/<household_id>/dependents/<dependent_id>", methods=["DELETE"])
def remove_dependent(household_id, dependent_id):
    household, error = load_my_household(household_id)
    if error:
        return error

    dependent = find_dependent(household, dependent_id)
    if dependent is None:
        return jsonify({"error": "Dependent not found"}), 404

    # Block the removal so no medication, appointment or doctor is lost by accident
    if has_items(dependent_id):
        return jsonify({"error": "Delete their medications, appointments and doctors first"}), 409

    household["dependents"].remove(dependent)
    save_household(household)
    return jsonify({"message": "Removed"})


# Start the server only when this file is run directly
if __name__ == "__main__":
    app.run(debug=True)   # Debug on for local work only (off in Backend 4/4)
