const cors = require("cors");
const config = require("../services/getConfig");

//configure cors options
function corsOptionsDelegate(req, callback) {
	var corsOptions;
	if (config.originAllowList.indexOf(req.header("Origin")) !== -1) {
		corsOptions = { origin: true }; // reflect (enable) the requested origin in the CORS response
	} else {
		corsOptions = { origin: false }; // disable CORS for this request
	}
	callback(null, corsOptions); // callback expects two parameters: error and options
}

module.exports = cors(corsOptionsDelegate);
