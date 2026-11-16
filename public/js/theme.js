// Theme toggle
const themeButton = document.querySelector(".theme-toggle");
const root = document.documentElement;

function setTheme(theme) {
    root.setAttribute("data-theme", theme);
    themeButton.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    try {
        localStorage.setItem("theme", theme);
    } catch (error) {
        // storage can be blocked (private browsing)
    }
}

let savedTheme = null;
try {
    savedTheme = localStorage.getItem("theme");
} catch (error) {
}
setTheme(savedTheme === "dark" ? "dark" : "light");

themeButton.addEventListener("click", function () {
    const isDark = root.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "light" : "dark");
});
