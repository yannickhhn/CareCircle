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
