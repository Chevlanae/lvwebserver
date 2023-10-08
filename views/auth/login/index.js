import { postJSON } from "../../utils/api";

var username = document.querySelector("input#username"),
	password = document.querySelector("input#password"),
	csrfToken = document.querySelector("input#csrf"),
	submit = document.querySelector("#submit"),
	errorBox = document.querySelector("#errorBox");

function login() {
	postJSON("/auth/login", {
		username: username.value,
		password: password.value,
		_csrf: csrfToken.value,
	}).then((response) => {
		if (response.status === "ERROR") {
			username.value = "";
			password.value = "";

			errorBox.style.display = "block";
			errorBox.innerHTML = response.message;
		}
	});
}

username.addEventListener("keyup", (event) => event.key === "Enter" && login());
password.addEventListener("keyup", (event) => event.key === "Enter" && login());
submit.addEventListener("click", login);
