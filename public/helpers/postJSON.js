import * as swal from "sweetalert2";

function parseResponse(response) {
	if (response.redirected === true) {
		window.location.href = response.url;
		return;
	}
	response
		.json()
		.then((body) => {
			if (body.errors.length != 0) {
				var errorString = "<p>";
				for (var error in response.errors) {
					errorString = errorString + error.toString() + "<br>";
				}
				errorString = errorString + "</p>";

				swal.fire({
					title: "Error",
					html: `<strong>${response.message}</strong><br><br>${errorString}`,
					icon: "error",
				});
			} else {
				swal.fire({
					text: `${response.message}`,
				});
			}
		})
		.catch((e) => {
			swal.fire({
				title: "Error",
				text: e.toString(),
				icon: "error",
			});
		});
}

/**
 * POSTs object as JSON to specified url, then either redirects or displays an alert with the server message depending on the response
 * @param {string} url URL to POST to
 * @param {Object} data any JSON compatible object
 */
export default async function postJSON(url, data) {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		referrerPolicy: "origin",
		body: JSON.stringify(data),
	});
	console.log(response);
	parseResponse(response);
}
