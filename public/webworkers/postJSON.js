async function postJSON(url = "", data = {}) {
	const response = await fetch(url, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		referrerPolicy: "origin",
		body: JSON.stringify(data),
	});

	return response.json();
}

module.exports = postJSON;
