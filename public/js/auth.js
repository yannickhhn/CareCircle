// Log in and register pages: the Show/Hide button next to each password field
const toggleButtons = document.querySelectorAll(".toggle-password");

toggleButtons.forEach(function (button) {
    // aria-controls holds the id of the input this button controls
    const input = document.getElementById(button.getAttribute("aria-controls"));

    button.addEventListener("click", function () {
        const isHidden = input.type === "password";

        // type "text" shows the characters, type "password" hides them
        input.type = isHidden ? "text" : "password";
        button.textContent = isHidden ? "Hide" : "Show";
        // tells screen readers whether the password is showing
        button.setAttribute("aria-pressed", isHidden);
    });
});


// ---------- Form validation (register and login) ----------

// Returns true if the email has the shape name@site.domain (no spaces, one @, a dot after it)
function isValidEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

// Shows a message under a field and turns its border red
function showError(input, message) {
    const errorBox = document.getElementById(input.id + "-error");
    errorBox.textContent = message;
    input.setAttribute("aria-invalid", "true");
}

// Removes the message under a field and its red border
function clearError(input) {
    const errorBox = document.getElementById(input.id + "-error");
    errorBox.textContent = "";
    input.removeAttribute("aria-invalid");
}

// Checks one field against its rule, shows or clears its error, and returns true if it is valid
function validateField(input) {
    const value = input.value.trim();
    let message = "";

    if (value === "") {
        message = "This field is required.";
    } else if (input.id === "email" && !isValidEmail(value)) {
        message = "Please enter a correct email";
    } else if (input.minLength > 0 && input.value.length < input.minLength) {
        // only the register password has minlength="8" in the HTML
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
const confirmInput = document.getElementById("confirm-password"); // null on the login page

// Turns off the browser's own error bubbles so our messages show instead (they still work if JS is off)
form.noValidate = true;

inputs.forEach(function (input) {
    // Checks a field when the user leaves it
    input.addEventListener("blur", function () {
        validateField(input);
    });

    // Re-checks while typing, but only once a field already shows an error
    input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") {
            validateField(input);
        }
        // changing the password can make "confirm password" right or wrong again
        if (input.id === "password" && confirmInput && confirmInput.value !== "") {
            validateField(confirmInput);
        }
    });
});

// Checks every field on submit and puts the cursor on the first wrong one
form.addEventListener("submit", function (event) {
    // there is no server yet, so the form never really sends (remove when the Flask route exists)
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
