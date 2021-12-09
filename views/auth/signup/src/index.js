import postJSON from "../../../helpers/postJSON.js";
import * as swal from "sweetalert2";

const origin = window.origin;

function confirmed() {
	var email = document.getElementById("email"),
		confirmEmail = document.getElementById("confirmEmail"),
		password = document.getElementById("password"),
		confirmPassword = document.getElementById("confirmPassword"),
		redborder = "border: 1px solid rgba(219, 33, 20, 1);",
		emailConfirmed = email.value === confirmEmail.value,
		passwordConfirmed = password.value === confirmPassword.value,
		notConfirmed = [];

	if (!emailConfirmed) {
		email.setAttribute("style", redborder);
		confirmEmail.setAttribute("style", redborder);
		notConfirmed.push("Email");
	} else {
		email.setAttribute("style", "");
		confirmEmail.setAttribute("style", "");
	}

	if (!passwordConfirmed) {
		password.setAttribute("style", redborder);
		confirmPassword.setAttribute("style", redborder);
		notConfirmed.push("Password");
	} else {
		password.setAttribute("style", "");
		confirmPassword.setAttribute("style", "");
	}

	return notConfirmed;
}

function signup() {
	if (confirmed().length != 0) {
		var eString = "<p>";
		for (var e of conf) {
			eString = `${eString} ${e} fields do not match.<br>`;
		}
		eString = eString + "</p>";
		swal.fire({
			title: eString,
			icon: "error",
		});
	} else {
		var email = document.getElementById("email").value,
			username = document.getElementById("username").value,
			password = document.getElementById("password").value,
			csrfToken = document.getElementById("csrf").value;

		postJSON(origin + "/auth/signup", {
			email: email,
			username: username,
			password: password,
			_csrf: csrfToken,
		});
	}
}

//event listeners
document.getElementById("submit").onclick = signup;
