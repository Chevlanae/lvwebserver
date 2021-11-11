const needle = require("needle");
const swal = require("sweetalert2");

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

	var endpoint = origin + "/login";
	var options = { json: true };
	var body = {
		username: username,
		password: password,
	};

	needle.post(endpoint, body, options, (err, res) => {
		if (err) {
			swal.fire("Error", err.toString(), "error");
		}

		if (res) {
			if ("errors" in res.body) {
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
			}
		}
	});
}

module.exports = {
	login: login,
};
