// Load data: reads the 5 JSON files into one object
const DATA_URL = "../../data/";
const data = {};
const CURRENT_HOUSEHOLD_ID = "h1";

async function loadJSON(fileName) {
    const response = await fetch(DATA_URL + fileName);
    if (!response.ok) {
        throw new Error("Could not load " + fileName);
    }
    return response.json();
}

// Dates: "2026-11-16" in local time
function toDateString(date) {
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return date.getFullYear() + "-" + month + "-" + day;
}

// Header: household name, plan, member count and today's date
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
    } catch (error) {
        console.error(error);
    }
}

loadData();
