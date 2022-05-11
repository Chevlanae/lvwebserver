import { RequestHandler } from "express";
import { validationResult } from "express-validator";

export const validateParams: RequestHandler = function (req, res, next) {
	const validationErrors = validationResult(req);

	if (!validationErrors.isEmpty()) {
		return res.status(400).json({ message: "Invalid Parameters", errors: validationErrors.mapped() });
	} else {
		next();
	}
};
