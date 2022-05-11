const corsModule = require("cors");

import * as corsTypes from "cors";

const corsOptions: corsTypes.CorsOptionsDelegate = function (req, callback) {
	let corsOptions;

	if (config.originAllowList.some((value) => value === req.headers.origin)) {
		corsOptions = { origin: true };
	} else {
		corsOptions = { origin: false };
	}

	callback(null, corsOptions);
};

export const cors = corsModule(corsOptions);
