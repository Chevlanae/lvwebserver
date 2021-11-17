const setAuthentication = require("./authentication.js");

function setRouting(app) {
	app = setAuthentication(app);
	return app;
}

module.exports = setRouting;
