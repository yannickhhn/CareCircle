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
