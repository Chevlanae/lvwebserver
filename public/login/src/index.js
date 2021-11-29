import * as swal from "sweetalert2";
import * as postJSON from "../../webworkers/postJSON.js";

const origin = window.origin;

function login() {
	var username = document.getElementById("username").value,
		password = document.getElementById("password").value,
		usernameError = document.getElementById("usernameError"),
		passwordError = document.getElementById("passwordError");

	if (username == "") {
		usernameError.innerHTML = `<span style="color: red;"> Please enter your username.</span>`;
		return;
	}

	if (password == "") {
		passwordError.innerHTML = `<span style="color: red;"> Please enter your password.</span>`;
		return;
	}

	var url = origin + "/login";
	var body = {
		username: username,
		password: password,
	};

	postJSON(url, body).then((body) => {
		if (body.errors.length != 0) {
			var errorString = "<p>";
			for (var error in res.body.errors) {
				errorString = errorString + error.toString() + "<br>";
			}
			errorString = errorString + "</p>";

			swal.fire({
				title: "Error",
				html: errorString,
				icon: "error",
			});
		} else {
			swal.fire({
				title: body.message,
				icon: "error",
			});
		}
	});
}

document.getElementById("submit").onclick = login;
