import * as swal from "sweetalert2";
import postJSON from "../../helpers/postJSON.js";

const origin = window.origin;

function login() {
	var username = document.getElementById("username").value,
		password = document.getElementById("password").value;

	if (username == "") {
		swal.fire({
			title: "Please enter your username.",
			icon: "error",
		});
		return;
	}

	if (password == "") {
		swal.fire({
			title: "Please enter your password.",
			icon: "error",
		});
		return;
	}

	postJSON(origin + "/login", {
		username: username,
		password: password,
	});
}

document.getElementById("submit").onclick = login;
