// Load data: reads the 5 JSON files into one object
const DATA_URL = "../../data/";
const data = {};
const CURRENT_HOUSEHOLD_ID = "h1";

// Fetches one JSON file from data/ and returns its contents, or throws if it can't be loaded
async function loadJSON(fileName) {
    const response = await fetch(DATA_URL + fileName);
    if (!response.ok) {
        throw new Error("Could not load " + fileName);
    }
    return response.json();
}

// Returns a date as "2026-11-16" in local time (toISOString uses UTC and can be a day off)
function toDateString(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
}

// Returns a time as "14:05" in local time
function toTimeString(date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return hours + ":" + minutes;
}

// Returns text with its first letter in capitals ("familial" becomes "Familial")
function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// Fills the header with the household's name, plan, member count and today's date
function renderHeader(household) {
    const plan = capitalize(household.plan);
    const memberCount = household.managerIds.length + household.dependents.length;
    const today = new Date();

    document.getElementById("household-name").textContent = household.name;
    document.querySelector(".app-header .plan-line").textContent = plan + " · " + memberCount + " members";

    const time = document.querySelector(".app-header time");
    time.dateTime = toDateString(today);
    time.textContent = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

// Returns a new element with an optional class and plain text (textContent, so user text is never read as HTML)
function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
}

// Returns "07:30" as "7:30 AM"
function formatTime(hhmm) {
    const parts = hhmm.split(":");
    const hour = Number(parts[0]);
    const suffix = hour < 12 ? "AM" : "PM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return hour12 + ":" + parts[1] + " " + suffix;
}

// Returns "2026-11-18" as "Wed 18 Nov" (built from its parts, since new Date("2026-11-18") is read as UTC and can be a day off)
function formatDay(dateString) {
    const parts = dateString.split("-");
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// Returns the first name of a dependent in this household ("Lucas Brown" becomes "Lucas")
function getFirstName(household, dependentId) {
    const dependent = household.dependents.find(function (d) {
        return d.id === dependentId;
    });
    return dependent.name.split(" ")[0];
}

// Draws this household's medications for today: given today goes to Filled, the rest to Upcoming (sorted by time)
function renderMedications(household) {
    const upcomingList = document.getElementById("med-upcoming");
    const filledList = document.getElementById("med-filled");
    upcomingList.textContent = "";
    filledList.textContent = "";

    const now = new Date();
    const today = toDateString(now);
    const nowTime = toTimeString(now);

    const meds = data.medications.filter(function (med) {
        return med.householdId === household.id;
    });
    meds.sort(function (a, b) {
        return a.time.localeCompare(b.time);
    });

    meds.forEach(function (med) {
        const isFilled = Boolean(med.givenAt) && med.givenAt.startsWith(today);
        const isOverdue = !isFilled && med.time < nowTime;
        const row = createMedRow(med, household, today, isFilled, isOverdue);
        if (isFilled) {
            filledList.appendChild(row);
        } else {
            upcomingList.appendChild(row);
        }
    });
}

// Returns one medication row: avatar if given, checkbox, who and what, Overdue badge, time, and Delete
function createMedRow(med, household, today, isFilled, isOverdue) {
    const firstName = getFirstName(household, med.dependentId);

    const row = makeElement("li", "med-row");
    if (isOverdue) row.classList.add("is-overdue");
    if (isFilled) row.classList.add("is-filled");

    if (isFilled) {
        const avatar = makeElement("span", "avatar", firstName.charAt(0));
        avatar.setAttribute("aria-hidden", "true");
        row.appendChild(avatar);
    }

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = "dose-" + med.id;
    checkbox.checked = isFilled;
    checkbox.addEventListener("change", function () {
        toggleDose(med, household, checkbox.checked);
    });
    row.appendChild(checkbox);

    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.append(
        makeElement("span", "med-who", firstName),
        makeElement("span", "med-name", med.name + " · " + med.dose)
    );
    row.appendChild(label);

    if (isOverdue) {
        row.appendChild(makeElement("span", "badge-overdue", "Overdue"));
    }

    const time = makeElement("time", null, formatTime(med.time) + " ");
    time.dateTime = today + "T" + med.time;
    time.appendChild(makeElement("span", null,
        new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })));
    row.appendChild(time);

    if (isFilled) {
        row.appendChild(createGivenBy(med));
    }

    const deleteButton = makeElement("button", "delete-btn", "Delete");
    deleteButton.type = "button";
    row.appendChild(deleteButton);

    return row;
}

const CHECK_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/></svg>';

// Returns "✓ Lisa · 8:05 AM": who gave the dose and when
// (innerHTML is only used for the fixed icon from the code, never for user data)
function createGivenBy(med) {
    const manager = data.managers.find(function (m) {
        return m.id === med.givenBy;
    });

    const givenBy = makeElement("span", "given-by");
    givenBy.innerHTML = CHECK_ICON;
    givenBy.append(
        makeElement("span", "visually-hidden", "Given by"),
        " " + manager.firstName + " · "
    );

    const time = makeElement("time", null, formatTime(med.givenAt.slice(11, 16)));
    time.dateTime = med.givenAt;
    givenBy.appendChild(time);
    return givenBy;
}

// Marks a dose as given now by the current manager (the household's first manager until login exists),
// or clears it if unticked, then redraws the lists
function toggleDose(med, household, isGiven) {
    if (isGiven) {
        const now = new Date();
        med.givenAt = toDateString(now) + "T" + toTimeString(now);
        med.givenBy = household.managerIds[0];
    } else {
        med.givenAt = null;
        med.givenBy = null;
    }
    renderMedications(household);
}

// Draws this household's appointments by date: still ahead goes to Upcoming, already past to Overdue
function renderAppointments(household) {
    const upcomingList = document.getElementById("appt-upcoming");
    const overdueList = document.getElementById("appt-overdue");
    upcomingList.textContent = "";
    overdueList.textContent = "";

    const now = new Date();
    const nowString = toDateString(now) + "T" + toTimeString(now);

    const appts = data.appointments.filter(function (appt) {
        return appt.householdId === household.id;
    });
    appts.sort(function (a, b) {
        return (a.date + "T" + a.time).localeCompare(b.date + "T" + b.time);
    });

    appts.forEach(function (appt) {
        const isOverdue = appt.date + "T" + appt.time < nowString;
        const card = createApptCard(appt, household, isOverdue);
        if (isOverdue) {
            overdueList.appendChild(card);
        } else {
            upcomingList.appendChild(card);
        }
    });
}

// Returns one appointment card: who, when, reason, place, notes and Delete
function createApptCard(appt, household, isOverdue) {
    const card = makeElement("li", "appt-card");
    if (isOverdue) card.classList.add("is-overdue");

    card.appendChild(makeElement("h4", "appt-who", getFirstName(household, appt.dependentId)));

    const when = makeElement("p", "appt-when");
    const time = makeElement("time", null, formatDay(appt.date) + " · " + formatTime(appt.time));
    time.dateTime = appt.date + "T" + appt.time;
    when.appendChild(time);
    card.appendChild(when);

    card.appendChild(makeElement("p", "appt-reason", appt.reason));
    card.appendChild(createPlace(appt.address));

    if (appt.notes.length > 0) {
        const notes = makeElement("ul", "appt-notes");
        appt.notes.forEach(function (note) {
            notes.appendChild(makeElement("li", null, note));
        });
        card.appendChild(notes);
    }

    const deleteButton = makeElement("button", "delete-btn", "Delete");
    deleteButton.type = "button";
    card.appendChild(deleteButton);
    return card;
}

// Returns the address on two lines: the place name, then the street ("Smile Dental, 45 Oak Avenue")
function createPlace(address) {
    const place = makeElement("p", "appt-place");
    const commaIndex = address.indexOf(",");
    if (commaIndex === -1) {
        place.textContent = address;
    } else {
        place.append(
            address.slice(0, commaIndex),
            document.createElement("br"),
            address.slice(commaIndex + 1).trim()
        );
    }
    return place;
}

// Draws the household section: plan line, managers with their email, and dependents with Edit and Remove
function renderHousehold(household) {
    const memberCount = household.managerIds.length + household.dependents.length;
    document.querySelector("#household .plan-line").textContent =
        capitalize(household.plan) + " · " + memberCount + " members";

    const managerList = document.getElementById("manager-list");
    managerList.textContent = "";
    household.managerIds.forEach(function (managerId) {
        const manager = data.managers.find(function (m) {
            return m.id === managerId;
        });
        managerList.appendChild(createMemberRow(manager.firstName, manager.email));
    });

    const dependentList = document.getElementById("dependent-list");
    dependentList.textContent = "";
    household.dependents.forEach(function (dependent) {
        const firstName = dependent.name.split(" ")[0];
        const row = createMemberRow(firstName, "Born " + dependent.birthYear);
        const editButton = createRowButton("btn-outline", "Edit", firstName);
        editButton.addEventListener("click", function () {
            startEditDependent(dependent);
        });
        row.append(editButton, createRowButton("delete-btn", "Remove", firstName));
        dependentList.appendChild(row);
    });
}

// Returns one member row: avatar with the first letter, name, and a detail (email or birth year)
function createMemberRow(name, detail) {
    const row = makeElement("li", "member-row");
    const avatar = makeElement("span", "avatar", name.charAt(0));
    avatar.setAttribute("aria-hidden", "true");
    row.append(avatar, makeElement("span", "member-name", name), makeElement("span", "member-detail", detail));
    return row;
}

// Returns a row button like "Edit", with the person's name added for screen readers ("Edit Lucas")
function createRowButton(className, label, name) {
    const button = makeElement("button", className, label);
    button.type = "button";
    button.appendChild(makeElement("span", "visually-hidden", " " + name));
    return button;
}

// Fills a "For who?" dropdown with a placeholder and this household's dependents
function fillDependentSelect(select, household) {
    select.textContent = "";
    const placeholder = makeElement("option", null, "Choose a person");
    placeholder.value = "";
    select.appendChild(placeholder);
    household.dependents.forEach(function (dependent) {
        const option = makeElement("option", null, dependent.name);
        option.value = dependent.id;
        select.appendChild(option);
    });
}

// Shows a message under a form field and marks it invalid (red border)
function showFieldError(input, message) {
    document.getElementById(input.id + "-error").textContent = message;
    input.setAttribute("aria-invalid", "true");
}

// Removes a form field's message and its invalid mark
function clearFieldError(input) {
    document.getElementById(input.id + "-error").textContent = "";
    input.removeAttribute("aria-invalid");
}

// Checks one form field, shows or clears its error, and returns true if valid
function validateField(input, household) {
    const value = input.value.trim();
    let message = "";

    if (value === "") {
        message = "This field is required.";
    } else if (input.name === "dependentId" && !household.dependents.some(function (d) { return d.id === value; })) {
        message = "Choose someone from this household.";
    } else if (input.maxLength > 0 && value.length > input.maxLength) {
        message = "Use at most " + input.maxLength + " characters.";
    } else if (input.type === "time" && !/^\d{2}:\d{2}$/.test(value)) {
        message = "Enter a time like 08:00.";
    } else if (input.type === "date" && !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        message = "Enter a date like 2026-11-20.";
    } else if (input.type === "date" && value < toDateString(new Date())) {
        message = "This date has already passed.";
    } else if (input.type === "number" && (!/^\d+$/.test(value) || Number(value) < Number(input.min) || Number(value) > Number(input.max))) {
        message = "Enter a year between " + input.min + " and " + input.max + ".";
    }

    if (message === "") {
        clearFieldError(input);
        return true;
    }
    showFieldError(input, message);
    return false;
}

// Returns a form field's value without spaces at both ends
function fieldValue(id) {
    return document.getElementById(id).value.trim();
}

// Sets up an Add form (its first field is the "For who?" dropdown): re-checks fields while they are fixed,
// clears errors on Cancel, and on Add calls save() only if every field is valid, then empties the form
function setUpAddForm(formId, fieldIds, household, save) {
    const form = document.getElementById(formId);
    const fields = fieldIds.map(function (id) {
        return document.getElementById(id);
    });

    fillDependentSelect(fields[0], household);
    form.noValidate = true;

    // Re-checks a field while it is being fixed
    form.addEventListener("input", function (event) {
        if (event.target.getAttribute("aria-invalid") === "true") {
            validateField(event.target, household);
        }
    });

    // Cancel: clears the error messages along with the fields
    form.addEventListener("reset", function () {
        fields.forEach(clearFieldError);
    });

    // Add: checks every field, then saves and empties the form
    form.addEventListener("submit", function (event) {
        event.preventDefault();

        let firstWrong = null;
        fields.forEach(function (input) {
            if (!validateField(input, household) && firstWrong === null) {
                firstWrong = input;
            }
        });
        if (firstWrong) {
            firstWrong.focus();
            return;
        }

        save();
        form.reset();
    });
}

// Add medication form: saves a new medication that hasn't been given yet
function setUpMedForm(household) {
    setUpAddForm("med-form", ["med-for", "med-name", "med-dose", "med-time"], household, function () {
        data.medications.push({
            id: "med" + Date.now(),
            householdId: household.id,
            dependentId: fieldValue("med-for"),
            name: fieldValue("med-name"),
            dose: fieldValue("med-dose"),
            time: fieldValue("med-time"),
            repeat: fieldValue("med-repeat"),
            note: fieldValue("med-note").slice(0, 200),
            givenBy: null,
            givenAt: null
        });
        renderMedications(household);
    });
}

// Add appointment form: saves a new appointment, with one note per non-empty line
function setUpApptForm(household) {
    setUpAddForm("appt-form", ["appt-for", "appt-reason", "appt-date", "appt-time", "appt-address"], household, function () {
        const notes = fieldValue("appt-notes").slice(0, 300).split("\n")
            .map(function (line) {
                return line.trim();
            })
            .filter(function (line) {
                return line !== "";
            });

        data.appointments.push({
            id: "a" + Date.now(),
            householdId: household.id,
            dependentId: fieldValue("appt-for"),
            reason: fieldValue("appt-reason"),
            date: fieldValue("appt-date"),
            time: fieldValue("appt-time"),
            address: fieldValue("appt-address"),
            notes: notes
        });
        renderAppointments(household);
    });
}

// Redraws everything that shows the household's people: header count, lists, rows, cards and both dropdowns
function refreshPeople(household) {
    renderHeader(household);
    renderHousehold(household);
    renderMedications(household);
    renderAppointments(household);
    fillDependentSelect(document.getElementById("med-for"), household);
    fillDependentSelect(document.getElementById("appt-for"), household);
}

let editingDependent = null;

// Dependent form: adds a new dependent, or saves changes to the one being edited
function setUpDependentForm(household) {
    const form = document.getElementById("dependent-form");
    const title = document.getElementById("dependent-form-title");
    const submitButton = form.querySelector('button[type="submit"]');
    const fields = [document.getElementById("dep-name"), document.getElementById("dep-birth-year")];
    document.getElementById("dep-birth-year").max = new Date().getFullYear();
    form.noValidate = true;

    // Re-checks a field while it is being fixed
    form.addEventListener("input", function (event) {
        if (event.target.getAttribute("aria-invalid") === "true") {
            validateField(event.target, household);
        }
    });

    // Cancel: clears the errors and goes back to "Add a dependent"
    form.addEventListener("reset", function () {
        fields.forEach(clearFieldError);
        editingDependent = null;
        title.textContent = "Add a dependent";
        submitButton.textContent = "Add";
    });

    // Add or Save: checks every field, then adds or updates the dependent and redraws
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        const allValid = fields.map(function (input) {
            return validateField(input, household);
        });
        const firstWrong = fields[allValid.indexOf(false)];
        if (firstWrong) {
            firstWrong.focus();
            return;
        }

        const person = editingDependent || { id: "d" + Date.now() };
        person.name = fieldValue("dep-name");
        person.birthYear = Number(fieldValue("dep-birth-year"));
        person.notes = fieldValue("dep-notes").slice(0, 200);
        if (!editingDependent) {
            household.dependents.push(person);
        }
        form.reset();
        refreshPeople(household);
    });
}

// Edit button: fills the dependent form with this person, switches it to "Save" and opens it on phone
function startEditDependent(dependent) {
    editingDependent = dependent;
    document.getElementById("dep-name").value = dependent.name;
    document.getElementById("dep-birth-year").value = dependent.birthYear;
    document.getElementById("dep-notes").value = dependent.notes;
    document.getElementById("dependent-form-title").textContent = "Edit " + dependent.name.split(" ")[0];
    document.querySelector('#dependent-form button[type="submit"]').textContent = "Save";
    const addButton = document.querySelector('[aria-controls="household-form-panel"]');
    setPanelOpen(addButton, document.getElementById("household-form-panel"), true);
    document.getElementById("dep-name").focus();
}

// Opens or closes an Add form pop-up and updates its (+) button for screen readers
function setPanelOpen(button, panel, isOpen) {
    panel.classList.toggle("is-open", isOpen);
    button.setAttribute("aria-expanded", isOpen);
    if (isOpen) {
        panel.querySelector("select, input").focus();
    }
}

// Each (+) button opens its panel; Cancel or a successful Add in any of its forms (both reset the form) closes it
function setUpAddButtons() {
    document.querySelectorAll(".add-btn").forEach(function (button) {
        const panel = document.getElementById(button.getAttribute("aria-controls"));
        button.addEventListener("click", function () {
            setPanelOpen(button, panel, !panel.classList.contains("is-open"));
        });
        panel.querySelectorAll("form").forEach(function (form) {
            form.addEventListener("reset", function () {
                setPanelOpen(button, panel, false);
            });
        });
    });
}

// Loads all the data, finds the current household and draws the dashboard
async function loadData() {
    try {
        data.managers = await loadJSON("managers.json");
        data.households = await loadJSON("households.json");
        data.medications = await loadJSON("medications.json");
        data.appointments = await loadJSON("appointments.json");
        data.doctors = await loadJSON("doctors.json");

        const household = data.households.find(function (h) {
            return h.id === CURRENT_HOUSEHOLD_ID;
        });
        renderHeader(household);
        renderMedications(household);
        renderAppointments(household);
        renderHousehold(household);
        setUpMedForm(household);
        setUpApptForm(household);
        setUpDependentForm(household);
        setUpAddButtons();
    } catch (error) {
        console.error(error);
    }
}

loadData();
