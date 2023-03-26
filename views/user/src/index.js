import { postJSON, generateInvalidParameterTextElement } from "../../utils/api";

var username = document.querySelector("span#username");
var email = document.querySelector("span#email");
var changeUsername = document.querySelector("input#changeUsername");
var changeEmail = document.querySelector("input#changeEmail");
var changePassword = document.querySelector("input#changePassword");

changeUsername.addEventListener("click", function () {
	let childInput = username.firstElementChild;

	if (childInput === null) {
		let textBox = document.createElement("input");

		textBox.type = "text";
		textBox.value = textBox.id = username.innerHTML;
		textBox.addEventListener("keyup", function (event) {
			if (event.key === "Enter") {
				postJSON("/user/change-username", { newUsername: this.value }).then((response) => {
					if (response.status === "OK") {
						this.parentNode.innerHTML = this.value;
					} else if (response.errors.newUsername !== undefined) {
						this.parentNode.appendChild(generateInvalidParameterTextElement(response, "newUsername"));
					}
				});
			}
		});

		username.replaceChildren(textBox);
	} else {
		username.innerHTML = childInput.id;
	}
});

changeEmail.addEventListener("click", function () {
	let childInput = email.firstElementChild;

	if (childInput === null) {
		let textBox = document.createElement("input");

		textBox.type = "text";
		textBox.value = textBox.id = email.innerHTML;
		textBox.addEventListener("keyup", function (event) {
			if (event.key === "Enter") {
				postJSON("/user/change-email", { newEmail: this.value }).then((response) => {
					if (response.status === "OK") {
						this.parentNode.innerHTML = this.value;
					} else if (response.errors.newEmail !== undefined) {
						this.parentNode.appendChild(generateInvalidParameterTextElement(response, "newEmail"));
					}
				});
			}
		});

		email.replaceChildren(textBox);
	} else {
		email.innerHTML = childInput.id;
	}
});

changePassword.addEventListener("click", async function () {
	let oldPassword = document.createElement("input"),
		newPassword = document.createElement("input"),
		parentDiv = document.createElement("div"),
		optionsDiv = document.querySelector("div#accountOptions"),
		existingParent = document.querySelector("div#passwordChange");

	if (existingParent !== null) existingParent.remove();
	else {
		oldPassword.type = "password";
		newPassword.type = "password";
		parentDiv.className = "flexDiv";
		parentDiv.id = "passwordChange";

		oldPassword.addEventListener("keyup", function (event) {
			if (event.key === "Enter") {
				parentDiv.innerHTML = "";
				parentDiv.insertAdjacentElement("afterbegin", newPassword);
				parentDiv.insertAdjacentHTML("afterbegin", "<h4>Enter your new password</h4>");
			}
		});

		newPassword.addEventListener("keyup", function (event) {
			if (event.key === "Enter") {
				postJSON("/user/change-password", {
					oldPassword: oldPassword.value,
					newPassword: newPassword.value,
				})
					.then((response) => {
						if (response.status === "OK") {
							parentDiv.remove();
						} else {
							oldPassword.setAttribute("value", "");
							newPassword.setAttribute("value", "");

							parentDiv.innerHTML = "";
							parentDiv.insertAdjacentElement("afterbegin", oldPassword);
							parentDiv.insertAdjacentHTML("afterbegin", "<h4>Enter your old password</h4>");

							if (response.errors.oldPassword !== undefined) parentDiv.insertAdjacentElement("beforeend", generateInvalidParameterTextElement(response, "oldPassword"));
							else if (response.errors.newPassword !== undefined) parentDiv.insertAdjacentElement("beforeend", generateInvalidParameterTextElement(response, "newPassword"));
						}
					})
					.catch(() => {});
			}
		});

		optionsDiv.insertAdjacentElement("afterend", parentDiv);
		parentDiv.insertAdjacentElement("afterbegin", oldPassword);
		parentDiv.insertAdjacentHTML("afterbegin", "<h4>Enter your old password</h4>");
	}
});
