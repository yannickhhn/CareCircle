// Load data: reads the 5 JSON files into one object
const DATA_URL = "../../data/";
const data = {};

async function loadJSON(fileName) {
    const response = await fetch(DATA_URL + fileName);
    if (!response.ok) {
        throw new Error("Could not load " + fileName);
    }
    return response.json();
}

async function loadData() {
    try {
        data.managers = await loadJSON("managers.json");
        data.households = await loadJSON("households.json");
        data.medications = await loadJSON("medications.json");
        data.appointments = await loadJSON("appointments.json");
        data.doctors = await loadJSON("doctors.json");
        console.log(data);
    } catch (error) {
        console.error(error);
    }
}

loadData();
