import * as postJSON from "../../webworkers/postJSON.js";
import * as swal from "sweetalert2";

const origin = window.origin;

var emailConfirmed = false;
var passwordConfirmed = false;

function signup() {
	var email = document.getElementById("email").value,
		username = document.getElementById("username").value,
		password = document.getElementById("password").value;

	var url = origin + "/signup";

	var body = {
		email: email,
		username: username,
		password: password,
	};

	postJSON(url, body)
		.then((response) => {
			var errorString = "";
			if ("errors" in response) {
				errorString = "<br><br><p>";
				for (var error in response.errors) {
					errorString = errorString + error.toString() + "<br>";
				}
				errorString = errorString + "</p>";
			}
			swal.fire({
				title: "Error",
				html: `${response.message}${errorString}`,
				icon: "error",
			});
		})
		.catch((e) => {
			swal.fire({
				title: "Error",
				text: e.toString(),
				icon: "error",
			});
		});
}

function confirm(original, confirmed, msgbox) {
	var originalElement = document.getElementById(original),
		confirmedElement = document.getElementById(confirmed);

	if (originalElement.value == "" || confirmedElement.value == "") {
		originalElement.setAttribute("style", "");
		confirmedElement.setAttribute("style", "");
		return;
	} else if (originalElement.value != confirmedElement.value) {
		msgbox.innerHTML = `<span style="color: red;"><strong>Fields do not match!</strong><span>`;
		originalElement.setAttribute("style", "border: 1px solid rgba(219, 33, 20, 1);");
		confirmedElement.setAttribute("style", "border: 1px solid rgba(219, 33, 20, 1);");

		if (original == "email") {
			emailConfirmed = false;
		} else if (original == "password") {
			passwordConfirmed = false;
		}
	} else if (originalElement.value == confirmedElement.value) {
		msgbox.innerHTML = `<span style="color: green;"><strong>Fields match.</strong><span>`;
		originalElement.setAttribute("style", "");
		confirmedElement.setAttribute("style", "");

		if (original == "email") {
			emailConfirmed = true;
		} else if (original == "password") {
			passwordConfirmed = true;
		}
	}
}

//event listeners
document.getElementById("submit").onclick = signup;
