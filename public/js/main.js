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
