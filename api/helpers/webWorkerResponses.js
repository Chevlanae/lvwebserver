//planned response types, form-urlencoded, html

/**
 * takes any message and/or errors and formats them into a response JSON
 * @param {string} message
 * @param {string | Error | Array<string> | Array<Error>} errors
 * @returns {JSON}
 */
function jsonResponse(message = "", errors = undefined) {
	var json = {
		message,
		errors: [],
	};
	json.message = message;
	if (errors) {
		if (typeof errors === typeof "") {
			json.errors[0] = errors;
		} else if (typeof errors === typeof Error()) {
			json.errors[0] = errors.toString();
		} else if (typeof errors === typeof []) {
			var index = 0;
			for (var error of errors) {
				if (typeof error === typeof Error()) {
					error = error.toString();
				}
				json.errors[index] = error;
				index++;
			}
		}
	}
	return json;
}

module.exports = {
	jsonResponse: jsonResponse,
};
