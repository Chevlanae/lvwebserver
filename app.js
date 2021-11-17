const express = require("express");
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");
const favicon = require("serve-favicon");
const https = require("https");
const MongoStore = require("connect-mongo");
const apiConstructor = require("./api");
const config = require("./config/config.json");
const checkSignIn = require("./api/helpers/checkSignIn.js");

//run loaders
require("./loaders");

//process args
var port;
process.argv.forEach((val, index) => {
	if (val == "--port") {
		try {
			port = new Number(process.argv[index + 1]).valueOf();
		} catch (e) {
			console.error(e);
		}
	}
});
if (port == undefined) {
	port = 4443;
}

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

var app = express();

//app config
app.use("/static", express.static("./static"));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(favicon(__dirname + "/static/images/favicon.ico"));
app.use(
	session({
		cookie: { secure: true, httpOnly: true, samesite: true, maxAge: 600000 },
		resave: false,
		saveUninitialized: true,
		name: "server.sid",
		secret: config.sessionSecrets,
		store: MongoStore.create({
			mongoUrl: config.dbURL,
			crypto: {
				secret: config.storeSecret,
			},
		}),
	})
);

//set cors for every request
app.use(cors(corsOptionsDelegate));

//serve index
app.get("/", checkSignIn, function (req, res) {
	res.sendFile("/html/index.html", { root: __dirname });
});

//set routing defined in "./api/"
app = apiConstructor(app);

//https config
var options = {
	key: config.SSL.key,
	cert: config.SSL.cert,
};

var server = https.createServer(options, app);

server.listen(port, () => {
	console.log("Server started on port: " + port.toString());
});

module.exports = {
	checkSignIn: checkSignIn,
};
