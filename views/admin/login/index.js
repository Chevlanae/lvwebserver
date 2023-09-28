import { postJSON } from "../../utils/api";

const origin = window.origin;

function login() {
	var username = document.getElementById("username").value,
		password = document.getElementById("password").value,
		csrfToken = document.getElementById("csrf").value;

	postJSON(origin + "/auth/login", {
		username: username,
		password: password,
		_csrf: csrfToken,
	});
}

document.getElementById("submit").onclick = login;
