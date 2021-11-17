const needle = require("needle");
const swal = require("sweetalert2");

const origin = window.origin;

var emailConfirmed = false;
var passwordConfirmed = false;

function signup() {
	var email = document.getElementById("email").value,
		username = document.getElementById("username").value,
		password = document.getElementById("password").value;

	if (emailConfirmed && passwordConfirmed) {
		var url = origin + "/signup",
			options = { json: true },
			body = {
				email: email,
				username: username,
				password: password,
			};

		needle.post(url, body, options, (err, res) => {
			if (err) {
				swal.fire({
					title: "Error",
					html: err.toString(),
					icon: "error",
				});
			} else if (res) {
				var errorString = "";
				if ("errors" in res.body) {
					errorString = "<br><br><p>";
					for (var error in res.body.errors) {
						errorString = errorString + error.toString() + "<br>";
					}
					errorString = errorString + "</p>";
				}
				swal.fire({
					title: "Error",
					html: `${res.body.message}${errorString}`,
					icon: "error",
				});
			}
		});
	} else if (!emailConfirmed) {
		swal.fire({
			title: "Email fields do not match.",
			icon: "error",
		});
	} else if (!passwordConfirmed) {
		swal.fire({
			title: "Password fields do not match.",
			icon: "error",
		});
	}
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
		originalElement.setAttribute(
			"style",
			"border: 1px solid rgba(219, 33, 20, 1);"
		);
		confirmedElement.setAttribute(
			"style",
			"border: 1px solid rgba(219, 33, 20, 1);"
		);

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

module.exports = {
	signup: signup,
	confirm: confirm,
};
