// Phone menu: the ☰ button shows or hides the nav links
const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("#nav-links");

function setMenu(isOpen) {
    navLinks.classList.toggle("open", isOpen);
    // tells screen readers whether the menu is open
    menuButton.setAttribute("aria-expanded", isOpen);
    menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
}

menuButton.addEventListener("click", function () {
    const isOpen = navLinks.classList.contains("open");
    setMenu(!isOpen);
});

// close the menu after a link is tapped, so the page shows again
navLinks.addEventListener("click", function (event) {
    if (event.target.tagName === "A") {
        setMenu(false);
    }
});

// Pricing: on computer the feature lists are always open.
// On phone they stay folded under "What's included" so all 3 plans fit on the screen.
const computerScreen = window.matchMedia("(min-width: 768px)");

function openFeatureLists() {
    document.querySelectorAll(".price-details").forEach(function (details) {
        details.open = computerScreen.matches;
    });
}

openFeatureLists();
// run again if the window is resized between phone and computer size
computerScreen.addEventListener("change", openFeatureLists);

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
