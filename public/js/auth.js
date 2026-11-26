// Show/hide password
const toggleButtons = document.querySelectorAll(".toggle-password");

// Switch each password field between hidden and visible text when its Show/Hide button is clicked
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

// Show a message under the field and mark it invalid (red border)
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

// Check one field against its rules, show or clear its error, and return true if valid
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

    // Re-check while typing once a field shows an error; re-check the confirm field when the password changes
    input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") {
            validateField(input);
        }
        if (input.id === "password" && confirmInput && confirmInput.value !== "") {
            validateField(confirmInput);
        }
    });
});

// Send the register form to the server, then go to the login page or show the server's error
async function sendRegister(status) {
    const body = {
        firstName: document.getElementById("first-name").value,
        email: document.getElementById("email").value,
        password: document.getElementById("password").value,
        confirmPassword: document.getElementById("confirm-password").value
    };

    try {
        const response = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        const result = await response.json();

        if (response.ok) {
            window.location.href = "login.html";
        } else {
            status.textContent = result.error;
        }
    } catch (error) {
        status.textContent = "Could not reach the server. Try again.";
    }
}

// Submit: check every field and put the cursor on the first wrong one
form.addEventListener("submit", function (event) {
    // Stop the browser from sending the form itself; fetch sends it instead
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
        status.textContent = "Please fix the fields marked above.";
        firstWrong.focus();
    } else if (form.id === "register-form") {
        status.textContent = "Creating your account...";
        sendRegister(status);
    } else {
        status.textContent = "Looks good!";
    }
});
