// Load data from the Flask server
const data = {};
let currentManagerId = null;   // Set from /api/me

// Fetch JSON from an API route, or throw on error
async function loadJSON(url) {
    const response = await fetch(url);
    // Send a logged-out visitor to the login page
    if (response.status === 401) {
        window.location.href = "../login.html";
        throw new Error("Not logged in");
    }
    if (!response.ok) {
        throw new Error("Could not load " + url);
    }
    return response.json();
}

// Send JSON to an API route and return the reply, or throw the server's error
async function sendJSON(method, url, body) {
    const response = await fetch(url, {
        method: method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body || {})
    });
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error);
    }
    return result;
}

// Return a local date like "2026-11-16" (toISOString uses UTC)
function toDateString(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
}

// Return a time as "14:05" in local time
function toTimeString(date) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return hours + ":" + minutes;
}

// Return text with a capital first letter
function capitalize(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

// Fill the header: name, plan, member count, today's date
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

// Return a new element with plain text (textContent, never HTML)
function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
}

// Return "07:30" as "7:30 AM"
function formatTime(hhmm) {
    const parts = hhmm.split(":");
    const hour = Number(parts[0]);
    const suffix = hour < 12 ? "AM" : "PM";
    const hour12 = hour % 12 === 0 ? 12 : hour % 12;
    return hour12 + ":" + parts[1] + " " + suffix;
}

// Return "2026-11-18" as "Wed 18 Nov" (local time, not UTC)
function formatDay(dateString) {
    const parts = dateString.split("-");
    const date = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    return date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// Return a dependent's first name
function getFirstName(household, dependentId) {
    const dependent = household.dependents.find(function (d) {
        return d.id === dependentId;
    });
    return dependent.name.split(" ")[0];
}

// Draw today's medications: given in Filled, the rest in Upcoming
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
        return a.times[0].localeCompare(b.times[0]);
    });

    meds.forEach(function (med) {
        // Skip medications whose end date has passed
        if (med.endDate && med.endDate < today) {
            return;
        }
        // Show the next dose of today, or the last one once all are given
        const doses = givenToday(med, today);
        const isFilled = doses.length >= med.times.length;
        const shownTime = isFilled ? med.times[med.times.length - 1] : med.times[doses.length];
        const isOverdue = !isFilled && shownTime < nowTime;
        const row = createMedRow(med, household, today, doses, shownTime, isFilled, isOverdue);
        if (isFilled) {
            filledList.appendChild(row);
        } else {
            upcomingList.appendChild(row);
        }
    });
}

// Return today's given doses of a medication
function givenToday(med, today) {
    return med.given.filter(function (dose) {
        return dose.date === today;
    });
}

// Return one medication row
function createMedRow(med, household, today, doses, shownTime, isFilled, isOverdue) {
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
        toggleDose(med, household, checkbox.checked, shownTime);
    });
    row.appendChild(checkbox);

    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.append(
        makeElement("span", "med-who", firstName),
        makeElement("span", "med-name", med.name + " · " + med.dose +
            (med.endDate ? " · until " + formatDay(med.endDate) : ""))
    );
    row.appendChild(label);

    if (isOverdue) {
        row.appendChild(makeElement("span", "badge-overdue", "Overdue"));
    }

    // Show "2 of 3 today" under the time, or today's date for a once-a-day medication
    const time = makeElement("time", null, formatTime(shownTime) + " ");
    time.dateTime = today + "T" + shownTime;
    const detail = med.times.length > 1
        ? Math.min(doses.length + 1, med.times.length) + " of " + med.times.length + " today"
        : new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
    time.appendChild(makeElement("span", null, detail));
    row.appendChild(time);

    if (doses.length > 0) {
        row.appendChild(createGivenBy(doses[doses.length - 1]));
    }

    const deleteButton = makeElement("button", "delete-btn", "Delete");
    deleteButton.type = "button";
    // Delete on the server after a confirm, then redraw
    deleteButton.addEventListener("click", async function () {
        if (!confirm("Delete " + med.name + "?")) {
            return;
        }
        try {
            await sendJSON("DELETE", "/api/households/" + household.id + "/medications/" + med.id);
            data.medications = data.medications.filter(function (m) {
                return m.id !== med.id;
            });
            renderMedications(household);
        } catch (error) {
            alert(error.message);
        }
    });
    row.appendChild(deleteButton);

    return row;
}

const CHECK_ICON = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.7 2.7L16 9.8"/></svg>';

// Return "✓ Lisa · 8:05 AM": who gave the last dose and when
// (innerHTML only for the fixed icon, never user data)
function createGivenBy(dose) {
    const manager = data.managers.find(function (m) {
        return m.id === dose.by;
    });

    const givenBy = makeElement("span", "given-by");
    givenBy.innerHTML = CHECK_ICON;
    givenBy.append(
        makeElement("span", "visually-hidden", "Given by"),
        " " + (manager ? manager.firstName : "A former manager") + " · "
    );

    const time = makeElement("time", null, formatTime(dose.at));
    time.dateTime = dose.date + "T" + dose.at;
    givenBy.appendChild(time);
    return givenBy;
}

// Give the next dose or undo the last one on the server, then redraw
async function toggleDose(med, household, isGiven, shownTime) {
    const url = "/api/households/" + household.id + "/medications/" + med.id + "/given";
    try {
        const saved = await sendJSON(isGiven ? "POST" : "DELETE", url, { time: shownTime });
        med.given = saved.given;
    } catch (error) {
        alert(error.message);
    }
    renderMedications(household);
}

// Draw appointments by date: future in Upcoming, past in Overdue
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

// Return one appointment card
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

// Return the address on two lines: place, then street
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

// Draw this household's doctor cards
function renderDoctors(household) {
    const list = document.getElementById("doctor-list");
    list.textContent = "";
    data.doctors.filter(function (doc) {
        return doc.householdId === household.id;
    }).forEach(function (doc) {
        list.appendChild(createDoctorCard(doc, household));
    });
}

// Return one doctor card
function createDoctorCard(doc, household) {
    const card = makeElement("li", "doctor-card");
    card.append(
        makeElement("p", "doctor-for", "For " + getFirstName(household, doc.dependentId)),
        makeElement("h4", "doctor-name", doc.name),
        makeElement("p", "doctor-role", doc.role)
    );

    const phone = makeElement("a", null, doc.phone);
    phone.href = "tel:" + doc.phone.replace(/[^\d+]/g, "");
    const email = makeElement("a", null, doc.email);
    email.href = "mailto:" + doc.email;
    const contact = makeElement("p", "doctor-contact");
    contact.appendChild(phone);
    if (doc.email) {
        contact.append(document.createElement("br"), email);
    }

    card.append(contact, createPlace(doc.address));
    return card;
}

// Draw the household section: plan, managers, dependents
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
        const removeButton = createRowButton("delete-btn", "Remove", firstName);
        removeButton.addEventListener("click", function () {
            removeDependent(household, dependent);
        });
        row.append(editButton, removeButton);
        dependentList.appendChild(row);
    });
}

// Return one member row: avatar, name, detail
function createMemberRow(name, detail) {
    const row = makeElement("li", "member-row");
    const avatar = makeElement("span", "avatar", name.charAt(0));
    avatar.setAttribute("aria-hidden", "true");
    row.append(avatar, makeElement("span", "member-name", name), makeElement("span", "member-detail", detail));
    return row;
}

// Return a row button with the person's name for screen readers
function createRowButton(className, label, name) {
    const button = makeElement("button", className, label);
    button.type = "button";
    button.appendChild(makeElement("span", "visually-hidden", " " + name));
    return button;
}

// Fill a "For who?" dropdown with the dependents
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

// Show the field's error and mark it invalid
function showFieldError(input, message) {
    document.getElementById(input.id + "-error").textContent = message;
    input.setAttribute("aria-invalid", "true");
}

// Remove a form field's message and its invalid mark
function clearFieldError(input) {
    document.getElementById(input.id + "-error").textContent = "";
    input.removeAttribute("aria-invalid");
}

// Check one field, show its error, return true if valid
function validateField(input, household) {
    const value = input.value.trim();
    let message = "";

    if (value === "") {
        if (input.required) {
            message = "This field is required.";
        }
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
    } else if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        message = "Enter an email like name@example.com.";
    } else if (input.type === "tel" && !/^[\d\s()+-]{7,20}$/.test(value)) {
        message = "Enter a phone number like 514-555-0101.";
    }

    if (message === "") {
        clearFieldError(input);
        return true;
    }
    showFieldError(input, message);
    return false;
}

// Return a form field's value without spaces at both ends
function fieldValue(id) {
    return document.getElementById(id).value.trim();
}

// Set up an Add form: live re-checks, save() only if all fields are valid
function setUpAddForm(formId, fieldIds, household, save) {
    const form = document.getElementById(formId);
    const fields = fieldIds.map(function (id) {
        return document.getElementById(id);
    });

    fillDependentSelect(fields[0], household);
    form.noValidate = true;

    // Re-check a field while it is being fixed
    form.addEventListener("input", function (event) {
        if (event.target.getAttribute("aria-invalid") === "true") {
            validateField(event.target, household);
        }
    });

    // On reset (Cancel or after Add): clear the errors
    form.addEventListener("reset", function () {
        fields.forEach(clearFieldError);
    });

    // Add: check every field, then save and empty the form
    form.addEventListener("submit", async function (event) {
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

        // Show the server's error under the first field, and keep the form
        try {
            await save();
            form.reset();
        } catch (error) {
            showFieldError(fields[0], error.message);
        }
    });
}

// Add medication form: save on the server, then redraw
function setUpMedForm(household) {
    const timeIds = ["med-time", "med-time-2", "med-time-3", "med-time-4"];
    setUpTimeCount(timeIds);

    setUpAddForm("med-form", ["med-for", "med-name", "med-dose"].concat(timeIds, ["med-end"]), household, async function () {
        // Send only the time fields that are shown
        const count = Number(fieldValue("med-count"));
        const times = timeIds.slice(0, count).map(fieldValue);

        const med = await sendJSON("POST", "/api/households/" + household.id + "/medications", {
            dependentId: fieldValue("med-for"),
            name: fieldValue("med-name"),
            dose: fieldValue("med-dose"),
            times: times,
            repeat: fieldValue("med-repeat"),
            endDate: fieldValue("med-end"),
            note: fieldValue("med-note")
        });
        data.medications.push(med);
        renderMedications(household);
    });
}

// Show as many time fields as "Times a day" asks for, and require only those
function setUpTimeCount(timeIds) {
    const countSelect = document.getElementById("med-count");

    function showTimes(count) {
        timeIds.forEach(function (id, index) {
            const input = document.getElementById(id);
            input.required = index < count;
            input.closest(".field").hidden = index >= count;
            if (index >= count) {
                clearFieldError(input);
            }
        });
    }

    countSelect.addEventListener("change", function () {
        showTimes(Number(countSelect.value));
    });
    // Go back to one time field when the form resets
    document.getElementById("med-form").addEventListener("reset", function () {
        showTimes(1);
    });
}

// Add appointment form, one note per line (page only until Backend 3/4)
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

// Redraw everything that shows the household's people
function refreshPeople(household) {
    renderHeader(household);
    renderHousehold(household);
    renderMedications(household);
    renderAppointments(household);
    renderDoctors(household);
    fillDependentSelect(document.getElementById("med-for"), household);
    fillDependentSelect(document.getElementById("appt-for"), household);
    fillDependentSelect(document.getElementById("doc-for"), household);
}

const PLAN_LIMITS = { economic: 4, familial: 8, extended: Infinity };

// Return true if the household is at its plan's member limit
function isHouseholdFull(household) {
    const memberCount = household.managerIds.length + household.dependents.length;
    return memberCount >= PLAN_LIMITS[household.plan];
}

// Return the "plan is full" message for this household's plan
function planFullMessage(household) {
    const limit = PLAN_LIMITS[household.plan];
    return "Your plan is full (" + limit + " of " + limit + " members). Upgrade to add more people.";
}

let editingDependent = null;

// Dependent form: add or edit on the server
function setUpDependentForm(household) {
    const form = document.getElementById("dependent-form");
    const title = document.getElementById("dependent-form-title");
    const submitButton = form.querySelector('button[type="submit"]');
    const fields = [document.getElementById("dep-name"), document.getElementById("dep-birth-year")];
    document.getElementById("dep-birth-year").max = new Date().getFullYear();
    form.noValidate = true;

    // Re-check a field while it is being fixed
    form.addEventListener("input", function (event) {
        if (event.target.getAttribute("aria-invalid") === "true") {
            validateField(event.target, household);
        }
    });

    // On reset (Cancel or after Save): clear errors, back to "Add"
    form.addEventListener("reset", function () {
        fields.forEach(clearFieldError);
        document.getElementById("plan-full").hidden = true;
        editingDependent = null;
        title.textContent = "Add a dependent";
        submitButton.textContent = "Add";
    });

    // Add or Save: block a full household, check fields, save on the server, redraw
    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!editingDependent && isHouseholdFull(household)) {
            const planFull = document.getElementById("plan-full");
            planFull.textContent = planFullMessage(household);
            planFull.hidden = false;
            return;
        }

        const allValid = fields.map(function (input) {
            return validateField(input, household);
        });
        const firstWrong = fields[allValid.indexOf(false)];
        if (firstWrong) {
            firstWrong.focus();
            return;
        }

        const body = {
            name: fieldValue("dep-name"),
            birthYear: fieldValue("dep-birth-year"),
            notes: fieldValue("dep-notes")
        };
        const url = "/api/households/" + household.id + "/dependents";

        // Show the server's error under the name, and keep the form
        try {
            if (editingDependent) {
                const saved = await sendJSON("PUT", url + "/" + editingDependent.id, body);
                Object.assign(editingDependent, saved);
            } else {
                household.dependents.push(await sendJSON("POST", url, body));
            }
            form.reset();
            refreshPeople(household);
        } catch (error) {
            showFieldError(fields[0], error.message);
        }
    });
}

// Remove a dependent on the server after a confirm, then redraw
async function removeDependent(household, dependent) {
    if (!confirm("Remove " + dependent.name + "?")) {
        return;
    }
    try {
        await sendJSON("DELETE", "/api/households/" + household.id + "/dependents/" + dependent.id);
        household.dependents = household.dependents.filter(function (d) {
            return d.id !== dependent.id;
        });
        refreshPeople(household);
    } catch (error) {
        alert(error.message);
    }
}

// Edit button: fill the form with this person, switch to "Save"
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

// Invite form: add a manager by email (page only until Backend 3/4)
function setUpInviteForm(household) {
    const form = document.getElementById("invite-form");
    const emailInput = document.getElementById("invite-email");
    form.noValidate = true;

    // Re-check the email while it is being fixed
    emailInput.addEventListener("input", function () {
        if (emailInput.getAttribute("aria-invalid") === "true") {
            validateField(emailInput, household);
        }
    });

    // On reset (Cancel or after Invite): clear the error
    form.addEventListener("reset", function () {
        clearFieldError(emailInput);
    });

    // Invite: block a full household, check the email, add the manager
    form.addEventListener("submit", function (event) {
        event.preventDefault();
        if (isHouseholdFull(household)) {
            showFieldError(emailInput, planFullMessage(household));
            emailInput.focus();
            return;
        }
        if (!validateField(emailInput, household)) {
            emailInput.focus();
            return;
        }

        const email = fieldValue("invite-email").toLowerCase();
        let manager = data.managers.find(function (m) {
            return m.email.toLowerCase() === email;
        });
        if (manager && household.managerIds.includes(manager.id)) {
            showFieldError(emailInput, "This person is already a manager of this household.");
            emailInput.focus();
            return;
        }
        if (!manager) {
            manager = { id: "m" + Date.now(), firstName: email.split("@")[0], email: email };
            data.managers.push(manager);
        }
        household.managerIds.push(manager.id);
        form.reset();
        refreshPeople(household);
    });
}

// Add doctor form (page only until Backend 3/4)
function setUpDoctorForm(household) {
    setUpAddForm("doctor-form", ["doc-for", "doc-name", "doc-role", "doc-phone", "doc-email", "doc-address"], household, function () {
        data.doctors.push({
            id: "doc" + Date.now(),
            householdId: household.id,
            dependentId: fieldValue("doc-for"),
            name: fieldValue("doc-name"),
            role: fieldValue("doc-role"),
            email: fieldValue("doc-email"),
            phone: fieldValue("doc-phone"),
            address: fieldValue("doc-address")
        });
        renderDoctors(household);
    });
}

// Open or close an Add pop-up and update its (+) button
function setPanelOpen(button, panel, isOpen) {
    panel.classList.toggle("is-open", isOpen);
    button.setAttribute("aria-expanded", isOpen);
    if (isOpen) {
        panel.querySelector("select, input").focus();
    }
}

// Open each (+) panel; close it when its form resets
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

// Return the ?household= one if it's mine, else my first
function pickHousehold(myHouseholds) {
    const requestedId = new URLSearchParams(window.location.search).get("household");
    const requested = myHouseholds.find(function (h) {
        return h.id === requestedId;
    });
    return requested || myHouseholds[0];
}

// Fill the household dropdown (hidden if only one); open the chosen one
function setUpHouseholdSelect(myHouseholds, household) {
    const select = document.getElementById("switch-household");
    if (myHouseholds.length < 2) {
        select.hidden = true;
        return;
    }
    myHouseholds.forEach(function (h) {
        // Drop a trailing "household" ("Miller household" becomes "Miller")
        const option = makeElement("option", null, h.name.replace(/ household$/i, ""));
        option.value = h.id;
        select.appendChild(option);
    });
    select.value = household.id;
    select.addEventListener("change", function () {
        window.location.search = "?household=" + encodeURIComponent(select.value);
    });
}

// Show only the create form, for a manager with no household
function showCreateHousehold() {
    document.querySelectorAll(".app-section").forEach(function (section) {
        section.hidden = section.id !== "create-household";
    });
    document.getElementById("household-name").textContent = "Welcome to CareCircle";
    document.querySelector(".app-header .plan-line").textContent = "Create your household to get started.";
    document.getElementById("switch-household").hidden = true;

    const form = document.getElementById("create-household-form");
    const input = document.getElementById("new-household-name");
    form.noValidate = true;

    // Check the name, send it, then reload into the new household
    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        if (!validateField(input, null)) {
            input.focus();
            return;
        }
        try {
            const response = await fetch("/api/households", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: input.value })
            });
            const result = await response.json();
            if (response.ok) {
                window.location.reload();
            } else {
                showFieldError(input, result.error);
            }
        } catch (error) {
            showFieldError(input, "Could not reach the server. Try again.");
        }
    });
}

// Load my households and the chosen one, then draw
async function loadData() {
    try {
        const me = await loadJSON("/api/me");
        currentManagerId = me.id;

        const myHouseholds = await loadJSON("/api/households");
        const picked = pickHousehold(myHouseholds);
        if (!picked) {
            showCreateHousehold();
            return;
        }

        const details = await loadJSON("/api/households/" + encodeURIComponent(picked.id));
        data.managers = details.managers;
        data.medications = details.medications;
        data.appointments = details.appointments;
        data.doctors = details.doctors;
        const household = details.household;

        setUpHouseholdSelect(myHouseholds, household);
        renderHeader(household);
        renderMedications(household);
        renderAppointments(household);
        renderDoctors(household);
        renderHousehold(household);
        setUpMedForm(household);
        setUpApptForm(household);
        setUpDependentForm(household);
        setUpInviteForm(household);
        setUpDoctorForm(household);
        setUpAddButtons();
    } catch (error) {
        console.error(error);
        document.getElementById("household-name").textContent = "Could not load your data. Is the server running?";
    }
}

// Log out on the server, then go to the login page
document.getElementById("logout-link").addEventListener("click", async function (event) {
    event.preventDefault();
    try {
        await fetch("/api/logout", { method: "POST" });
    } catch (error) {
        // Go to login even if the server is off
    }
    window.location.href = "../login.html";
});

loadData();
