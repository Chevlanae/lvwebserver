const navMenu = document.querySelector(".nav-bar #links");
const navIcon = document.querySelector(".nav-bar #menu-icon");

function toggleNavMenu() {
	//if style.display is not set to flex
	if (navMenu.style.display !== "flex") {
		//override current display setting
		navMenu.style.display = "flex";
	} else {
		//else remove override
		navMenu.removeAttribute("style");
	}
}

navIcon.addEventListener("click", toggleNavMenu);
