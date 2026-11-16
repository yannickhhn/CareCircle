// Phone menu
const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("#nav-links");

// Opens or closes the phone menu and updates its button for screen readers
function setMenu(isOpen) {
    navLinks.classList.toggle("open", isOpen);
    menuButton.setAttribute("aria-expanded", isOpen);
    menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
}

// The ☰ button toggles the menu
menuButton.addEventListener("click", function () {
    const isOpen = navLinks.classList.contains("open");
    setMenu(!isOpen);
});

// Tapping a link closes the menu
navLinks.addEventListener("click", function (event) {
    if (event.target.tagName === "A") {
        setMenu(false);
    }
});

// Pricing details: open on computer, folded on phone
const computerScreen = window.matchMedia("(min-width: 768px)");

// Opens the plan feature lists on computer and folds them on phone
function openFeatureLists() {
    document.querySelectorAll(".price-details").forEach(function (details) {
        details.open = computerScreen.matches;
    });
}

openFeatureLists();
computerScreen.addEventListener("change", openFeatureLists);
