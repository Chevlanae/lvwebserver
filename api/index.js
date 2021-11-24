const setAuthentication = require("./authentication.js");
const checkSignIn = require("../middlware/checkSignIn.js");

function setRouting(app) {
	app = setAuthentication(app);
	return app;
}

module.exports = setRouting;
