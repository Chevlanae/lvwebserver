//planned response types, form-urlencoded, html

/**
 * takes any message and/or errors and formats them into a response JSON
 * @param {string} message
 * @param {string | Error | Array<any>} errors
 * @returns {Object}
 */
function jsonResponse(message = "", errors = undefined) {
	var json = new Object({
		message: message,
		errors: [],
	});

	if (errors) {
		if (typeof errors === typeof "") {
			json.errors[0] = errors;
		} else if (typeof errors === typeof Error()) {
			json.errors[0] = errors.toString();
		} else if (typeof errors === typeof []) {
			json.errors = errors;
		}
	}
	return json;
}

module.exports = {
	jsonResponse: jsonResponse,
};
