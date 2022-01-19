function myFunction() {
	var x = document.getElementById("header");
	if (x.className === "header") {
		x.className += " responsive";
	} else {
		x.className = "header";
	}
}

document.getElementById("hamburger-icon").onclick = myFunction;
