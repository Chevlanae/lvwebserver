import postJSON from "../../../utils/postJSON.js";

const csrf = document.getElementById("csrf").value;

function resendEmail() {
	postJSON("/auth/signup/confirm", { _csrf: csrf });
}

document.getElementById("resendEmail").addEventListener("click", resendEmail);
