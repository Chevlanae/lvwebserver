const authenticationCheck = require("./authCheck");
const adminAuthCheck = require("./adminAuthCheck");
const cors = require("./cors");
const rateLimiter = require("./cors");
const validateRequest = require("./validateRequest");

module.exports = {
	authCheck: authenticationCheck,
	adminAuthCheck: adminAuthCheck,
	cors: cors,
	rateLimiter: rateLimiter,
	validateRequest: validateRequest,
};
