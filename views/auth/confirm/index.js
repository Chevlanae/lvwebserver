import { postJSON } from "../../utils/api";

const csrf = document.getElementById("csrf").value;

function resendEmail() {
	postJSON("/auth/signup/confirm", { _csrf: csrf });
}

document.getElementById("resendEmail").addEventListener("click", resendEmail);
