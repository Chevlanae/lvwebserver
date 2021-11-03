const express = require("express");
const session = require("express-session");
const cors = require("cors");
const bodyParser = require("body-parser");
const favicon = require("serve-favicon");
const https = require("https");
const MongoStore = require("connect-mongo");
const setRouting = require("./api/setRouting.js");
const config = require("./config/config.json");

//run loaders
require("./loaders/runLoaders.js");

//process args
var port;
process.argv.forEach((val, index) => {
	if (val == "--port") {
		try {
			port = new Number(argv[index + 1]);
		} catch (e) {
			console.error(e);
		}
	}
});
if (port == undefined) {
	port = 4443;
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

//configure cors options
var corsOptionsDelegate = function (req, callback) {
	var corsOptions;
	if (serverVar.originAllowList.indexOf(req.header("Origin")) !== -1) {
		corsOptions = { origin: true }; // reflect (enable) the requested origin in the CORS response
	} else {
		corsOptions = { origin: false }; // disable CORS for this request
	}
	callback(null, corsOptions); // callback expects two parameters: error and options
};

//authorization check
function checkSignIn(req, res, next) {
	if (req.session.user) {
		next(); //If authenticated session exists, proceed to page
	} else {
		res.redirect("/login");
	}
}

//serve index
app.get("/", checkSignIn, cors(corsOptionsDelegate), function (req, res) {
	res.sendFile("/html/index.html", { root: __dirname });
});

//set routing defined in "./api/"
app = setRouting(app);

//https config
var options = {
	key: config.SSL.key,
	cert: config.SSL.cert,
};

var server = https.createServer(options, app);

server.listen(port, () => {
	console.log("Server started on port: " + port.toString());
});
