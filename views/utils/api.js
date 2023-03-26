/**
 * POSTs object as JSON to specified url, then either redirects or displays an alert with the server message depending on the response
 * @param {string} url URL to POST to
 * @param {Object} data any JSON compatible object
 */
export async function postJSON(url, data) {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		referrerPolicy: "origin",
		body: JSON.stringify(data),
	});

	if (response.redirected === true) {
		window.location.href = response.url;
		return;
	}

	return await response.json();
}

export function generateInvalidParameterTextElement(response, paramaterName) {
	let errorMessage = document.createElement("span"),
		errorText = document.createTextNode(response.errors[paramaterName].msg),
		linebreak = document.createElement("br");

	errorMessage.appendChild(linebreak);
	errorMessage.appendChild(errorText);
	errorMessage.style = "color: red;";

	return errorMessage;
}
