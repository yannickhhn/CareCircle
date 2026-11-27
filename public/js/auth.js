// Show/hide password
const toggleButtons = document.querySelectorAll(".toggle-password");

// Show or hide the password when Show/Hide is clicked
toggleButtons.forEach(function (button) {
    const input = document.getElementById(button.getAttribute("aria-controls"));

    button.addEventListener("click", function () {
        const isHidden = input.type === "password";

        input.type = isHidden ? "text" : "password";
        button.textContent = isHidden ? "Hide" : "Show";
        button.setAttribute("aria-pressed", isHidden);
    });
});


// Form validation

// Return true if the email looks like name@site.domain
function isValidEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

// Show the field's error and mark it invalid
function showError(input, message) {
    const errorBox = document.getElementById(input.id + "-error");
    errorBox.textContent = message;
    input.setAttribute("aria-invalid", "true");
}

// Remove the field's message and its invalid mark
function clearError(input) {
    const errorBox = document.getElementById(input.id + "-error");
    errorBox.textContent = "";
    input.removeAttribute("aria-invalid");
}

// Check one field, show its error, return true if valid
function validateField(input) {
    const value = input.value.trim();
    let message = "";

    if (value === "") {
        message = "This field is required.";
    } else if (input.id === "email" && !isValidEmail(value)) {
        message = "Please enter a correct email";
    } else if (input.minLength > 0 && input.value.length < input.minLength) {
        // Check the length (only the register password has a minlength)
        message = "Use at least " + input.minLength + " characters.";
    } else if (input.id === "confirm-password" &&
               input.value !== document.getElementById("password").value) {
        message = "The passwords don't match.";
    }

    if (message === "") {
        clearError(input);
        return true;
    }
    showError(input, message);
    return false;
}

const form = document.querySelector(".auth-card form");
const inputs = form.querySelectorAll("input");
// Get the confirm field (null on the login page)
const confirmInput = document.getElementById("confirm-password");

// Turn off the browser's bubbles so our messages replace them
form.noValidate = true;

inputs.forEach(function (input) {
    // Check a field when the user leaves it
    input.addEventListener("blur", function () {
        validateField(input);
    });

    // Re-check while fixing an error, and confirm when the password changes
    input.addEventListener("input", function () {
        // Clear the old message under the button
        showStatus(document.getElementById("form-status"), "", false);

        if (input.getAttribute("aria-invalid") === "true") {
            validateField(input);
        }
        if (input.id === "password" && confirmInput && confirmInput.value !== "") {
            validateField(confirmInput);
        }
    });
});

// Show a message under the button, styled like field errors if it's an error
function showStatus(status, message, isError) {
    status.textContent = message;
    status.classList.toggle("is-error", isError);
}

// Send a form to the server, then go to the next page or show the error
async function sendForm(url, body, nextPage, status) {
    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const result = await response.json();

        if (response.ok) {
            window.location.href = nextPage;
        } else {
            showStatus(status, result.error, true);
        }
    } catch (error) {
        showStatus(status, "Could not reach the server. Try again.", true);
    }
}

// Submit: check every field, focus the first wrong one
form.addEventListener("submit", function (event) {
    // Stop the browser's own sending (fetch sends it)
    event.preventDefault();

    let firstWrong = null;
    inputs.forEach(function (input) {
        const isValid = validateField(input);
        if (!isValid && firstWrong === null) {
            firstWrong = input;
        }
    });

    const status = document.getElementById("form-status");
    if (firstWrong) {
        showStatus(status, "Please fix the fields marked above.", true);
        firstWrong.focus();
    } else if (form.id === "register-form") {
        showStatus(status, "Creating your account...", false);
        sendForm("/api/register", {
            firstName: document.getElementById("first-name").value,
            email: document.getElementById("email").value,
            password: document.getElementById("password").value,
            confirmPassword: document.getElementById("confirm-password").value
        }, "login.html", status);
    } else {
        showStatus(status, "", false);
        sendForm("/api/login", {
            email: document.getElementById("email").value,
            password: document.getElementById("password").value
        }, "app/dashboard.html", status);
    }
});
