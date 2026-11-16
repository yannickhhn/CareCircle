// Show/hide password
const toggleButtons = document.querySelectorAll(".toggle-password");

// Each Show/Hide button switches its password field between hidden and visible text
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

// Returns true if the email looks like name@site.domain
function isValidEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

// Shows a message under the field and marks it invalid (red border)
function showError(input, message) {
    const errorBox = document.getElementById(input.id + "-error");
    errorBox.textContent = message;
    input.setAttribute("aria-invalid", "true");
}

// Removes the field's message and its invalid mark
function clearError(input) {
    const errorBox = document.getElementById(input.id + "-error");
    errorBox.textContent = "";
    input.removeAttribute("aria-invalid");
}

// Checks one field against its rules, shows or clears its error, and returns true if valid
function validateField(input) {
    const value = input.value.trim();
    let message = "";

    if (value === "") {
        message = "This field is required.";
    } else if (input.id === "email" && !isValidEmail(value)) {
        message = "Please enter a correct email";
    } else if (input.minLength > 0 && input.value.length < input.minLength) {
        // only the register password has a minlength
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
// null on the login page
const confirmInput = document.getElementById("confirm-password");

// our messages replace the browser's bubbles
form.noValidate = true;

inputs.forEach(function (input) {
    // Checks a field when the user leaves it
    input.addEventListener("blur", function () {
        validateField(input);
    });

    // Re-checks while typing once a field shows an error; a new password re-checks the confirm field
    input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") {
            validateField(input);
        }
        if (input.id === "password" && confirmInput && confirmInput.value !== "") {
            validateField(confirmInput);
        }
    });
});

// Submit: checks every field and puts the cursor on the first wrong one
form.addEventListener("submit", function (event) {
    // no server route yet
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
    } else {
        status.textContent = "Looks good!";
    }
});
