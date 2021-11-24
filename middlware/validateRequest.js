const { validationResult } = require("express-validator");

function validateRequest(req, res, next) {
	//check request for errors
	const validationErrors = validationResult(req);

	if (!validationErrors.isEmpty()) {
		return res.status(400).json({ message: "Invalid Parameters", errors: validationErrors.mapped() });
	} else {
		next();
	}
}

module.exports = validateRequest;
