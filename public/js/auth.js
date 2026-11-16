// Show/hide password
const toggleButtons = document.querySelectorAll(".toggle-password");

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

function isValidEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
}

function showError(input, message) {
    const errorBox = document.getElementById(input.id + "-error");
    errorBox.textContent = message;
    input.setAttribute("aria-invalid", "true");
}

function clearError(input) {
    const errorBox = document.getElementById(input.id + "-error");
    errorBox.textContent = "";
    input.removeAttribute("aria-invalid");
}

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
const confirmInput = document.getElementById("confirm-password"); // null on the login page

// our messages replace the browser's bubbles
form.noValidate = true;

inputs.forEach(function (input) {
    input.addEventListener("blur", function () {
        validateField(input);
    });

    // re-check while typing once a field shows an error
    input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") {
            validateField(input);
        }
        if (input.id === "password" && confirmInput && confirmInput.value !== "") {
            validateField(confirmInput);
        }
    });
});

// Submit
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
