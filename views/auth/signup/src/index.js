import { postJSON } from "../../../utils/api";

const origin = window.origin;

function confirmed() {
	var email = document.getElementById("email"),
		confirmEmail = document.getElementById("confirmEmail"),
		password = document.getElementById("password"),
		confirmPassword = document.getElementById("confirmPassword"),
		redborder = "1px solid rgba(219, 33, 20, 1)",
		emailConfirmed = email.value === confirmEmail.value,
		passwordConfirmed = password.value === confirmPassword.value,
		notConfirmed = [];

	if (!emailConfirmed) {
		email.style.border = redborder;
		confirmEmail.style.border = redborder;
		notConfirmed.push("Email");
	} else {
		email.style.border = "";
		confirmEmail.style.border = "";
	}

	if (!passwordConfirmed) {
		password.style.border = redborder;
		confirmPassword.style.border = redborder;
		notConfirmed.push("Password");
	} else {
		password.style.border = "";
		confirmPassword.style.border = "";
	}

	return notConfirmed;
}

function signup() {
	var conf = confirmed();
	if (conf.length != 0) {
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
