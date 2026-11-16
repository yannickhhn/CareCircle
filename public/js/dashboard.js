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

// Fills the header with the household's name, plan, member count and today's date
function renderHeader(household) {
    const plan = household.plan.charAt(0).toUpperCase() + household.plan.slice(1);
    const memberCount = household.managerIds.length + household.dependents.length;
    const today = new Date();

    document.getElementById("household-name").textContent = household.name;
    document.querySelector(".app-header .plan-line").textContent = plan;
    document.querySelector(".app-header .member-count").textContent = memberCount + " members";

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
    const dependent = household.dependents.find(function (d) {
        return d.id === med.dependentId;
    });
    const firstName = dependent.name.split(" ")[0];

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
    } catch (error) {
        console.error(error);
    }
}

loadData();
