// Phone menu
const menuButton = document.querySelector(".menu-toggle");
const navLinks = document.querySelector("#nav-links");

function setMenu(isOpen) {
    navLinks.classList.toggle("open", isOpen);
    menuButton.setAttribute("aria-expanded", isOpen);
    menuButton.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
}

menuButton.addEventListener("click", function () {
    const isOpen = navLinks.classList.contains("open");
    setMenu(!isOpen);
});

navLinks.addEventListener("click", function (event) {
    if (event.target.tagName === "A") {
        setMenu(false);
    }
});

// Pricing details: open on computer, folded on phone
const computerScreen = window.matchMedia("(min-width: 768px)");

function openFeatureLists() {
    document.querySelectorAll(".price-details").forEach(function (details) {
        details.open = computerScreen.matches;
    });
}

openFeatureLists();
computerScreen.addEventListener("change", openFeatureLists);
