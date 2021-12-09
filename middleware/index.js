const authenticationCheck = require("./authenticationCheck");
const cors = require("./cors");
const rateLimiter = require("./cors");
const validateRequest = require("./validateRequest");

class middleware {
	static authCheck = authenticationCheck;
	static cors = cors;
	static rateLimiter = rateLimiter;
	static validateRequest = validateRequest;
}

module.exports = middleware;
