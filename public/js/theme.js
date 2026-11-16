// Theme toggle
const themeButton = document.querySelector(".theme-toggle");
const root = document.documentElement;

// Applies light or dark mode, updates the button label and remembers the choice
function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    themeButton.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    try {
        localStorage.setItem("theme", theme);
    } catch (error) {
        // storage can be blocked (private browsing)
    }
}

// On load: start with the saved theme, or light mode
let savedTheme = null;
try {
    savedTheme = localStorage.getItem("theme");
} catch (error) {
}
setTheme(savedTheme === "dark" ? "dark" : "light");

// The moon/sun button switches between light and dark
themeButton.addEventListener("click", function () {
    const isDark = root.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "light" : "dark");
});
