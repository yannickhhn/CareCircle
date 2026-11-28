// Settings: change my name and password, rename or leave my households

// Send JSON to an API route and return the reply, or throw the server's error
async function sendJSON(method, url, body) {
    const options = { method: method, headers: { "Content-Type": "application/json" } };
    if (body) {
        options.body = JSON.stringify(body);
    }
    const response = await fetch(url, options);
    // Send a logged-out visitor to the login page
    if (response.status === 401) {
        window.location.href = "../login.html";
        throw new Error("Log in first");
    }
    const result = await response.json();
    if (!response.ok) {
        throw new Error(result.error);
    }
    return result;
}

// Show a message under a form, styled like field errors if it's an error
function showStatus(status, message, isError) {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
}

// Return a new element with plain text (textContent, never HTML)
function makeElement(tag, className, text) {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (text) element.textContent = text;
    return element;
}

// Save my first name on the server
function setUpNameForm(me) {
    const form = document.getElementById("name-form");
    const input = document.getElementById("first-name");
    const status = document.getElementById("name-status");
    input.value = me.firstName;

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        try {
            await sendJSON("PUT", "/api/me", { firstName: input.value });
            showStatus(status, "Name saved.", false);
        } catch (error) {
            showStatus(status, error.message, true);
        }
    });
}

// Change my password on the server, then empty the form
function setUpPasswordForm() {
    const form = document.getElementById("password-form");
    const status = document.getElementById("password-status");

    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        try {
            await sendJSON("PUT", "/api/me/password", {
                currentPassword: document.getElementById("current-password").value,
                newPassword: document.getElementById("new-password").value,
                confirmPassword: document.getElementById("confirm-password").value
            });
            form.reset();
            showStatus(status, "Password changed.", false);
        } catch (error) {
            showStatus(status, error.message, true);
        }
    });
}

// Return one household panel with a rename form and a Leave button
function createHouseholdCard(household) {
    const card = makeElement("div", "side-panel");
    card.appendChild(makeElement("h3", null, household.name));

    const form = document.createElement("form");
    const field = makeElement("div", "field");
    const label = makeElement("label", null, "Household name");
    const input = document.createElement("input");
    input.type = "text";
    input.id = "name-" + household.id;
    input.required = true;
    input.maxLength = 50;
    input.value = household.name;
    label.htmlFor = input.id;
    field.append(label, input);

    const actions = makeElement("div", "form-actions");
    const saveButton = makeElement("button", "btn", "Rename");
    saveButton.type = "submit";
    const leaveButton = makeElement("button", "delete-btn", "Leave");
    leaveButton.type = "button";
    actions.append(saveButton, leaveButton);
    const status = makeElement("p", "form-status");
    status.setAttribute("role", "status");
    form.append(field, actions, status);

    // Rename on the server, then update the card title
    form.addEventListener("submit", async function (event) {
        event.preventDefault();
        try {
            const saved = await sendJSON("PUT", "/api/households/" + household.id, { name: input.value });
            card.querySelector("h3").textContent = saved.name;
            showStatus(status, "Household renamed.", false);
        } catch (error) {
            showStatus(status, error.message, true);
        }
    });

    // Leave on the server after a confirm, then remove the card
    leaveButton.addEventListener("click", async function () {
        if (!confirm("Leave " + household.name + "? You'll lose access to it.")) {
            return;
        }
        try {
            await sendJSON("POST", "/api/households/" + household.id + "/leave");
            card.remove();
        } catch (error) {
            showStatus(status, error.message, true);
        }
    });

    card.appendChild(form);
    return card;
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

// Load me and my households, then fill the page
async function loadSettings() {
    try {
        const me = await sendJSON("GET", "/api/me");
        setUpNameForm(me);
        setUpPasswordForm();

        const households = await sendJSON("GET", "/api/households");
        const cards = document.getElementById("household-cards");
        households.forEach(function (household) {
            cards.appendChild(createHouseholdCard(household));
        });
    } catch (error) {
        console.error(error);
    }
}

loadSettings();
