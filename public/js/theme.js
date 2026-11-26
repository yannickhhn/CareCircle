// Theme toggle
const themeButton = document.querySelector(".theme-toggle");
const root = document.documentElement;

// Apply light or dark mode, update the button label and remember the choice
function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    themeButton.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    try {
        localStorage.setItem("theme", theme);
    } catch (error) {
        // Ignore blocked storage (private browsing)
    }
}

// On load: start with the saved theme, or light mode
let savedTheme = null;
try {
    savedTheme = localStorage.getItem("theme");
} catch (error) {
}
setTheme(savedTheme === "dark" ? "dark" : "light");

// Switch between light and dark when the moon/sun button is clicked
themeButton.addEventListener("click", function () {
    const isDark = root.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "light" : "dark");
});
