// Phone menu
const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("#nav-links");

// Open or close the phone menu and update its button for screen readers
function setMenu(isOpen) {
    navLinks.classList.toggle("open", isOpen);
    menuButton.setAttribute("aria-expanded", isOpen);
    menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
}

// Toggle the menu when the ☰ button is clicked
menuButton.addEventListener("click", function () {
    const isOpen = navLinks.classList.contains("open");
    setMenu(!isOpen);
});

// Close the menu when a link is tapped
navLinks.addEventListener("click", function (event) {
    if (event.target.tagName === "A") {
        setMenu(false);
    }
});

// Pricing details: open on computer, folded on phone
const computerScreen = window.matchMedia("(min-width: 768px)");

// Open the plan feature lists on computer and fold them on phone
function openFeatureLists() {
    document.querySelectorAll(".price-details").forEach(function (details) {
        details.open = computerScreen.matches;
    });
}

openFeatureLists();
computerScreen.addEventListener("change", openFeatureLists);
