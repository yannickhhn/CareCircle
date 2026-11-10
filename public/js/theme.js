// Used by every page: the moon/sun button in the header.
// Theme button: switches between light and dark mode and remembers the choice
const themeButton = document.querySelector(".theme-toggle");
const root = document.documentElement; // the <html> element

function setTheme(theme) {
    root.setAttribute("data-theme", theme); // the CSS reads this to pick the colours
    themeButton.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    try {
        localStorage.setItem("theme", theme);
    } catch (error) {
        // storage can be blocked (private browsing): the choice just isn't remembered
    }
}

let savedTheme = null;
try {
    savedTheme = localStorage.getItem("theme");
} catch (error) {
    // storage blocked: start in light mode
}
setTheme(savedTheme === "dark" ? "dark" : "light");

themeButton.addEventListener("click", function () {
    const isDark = root.getAttribute("data-theme") === "dark";
    setTheme(isDark ? "light" : "dark");
});
