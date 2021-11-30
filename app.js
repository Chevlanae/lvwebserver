const express = require("express");
const session = require("express-session");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const favicon = require("serve-favicon");
const checkSignIn = require("./middleware/checkSignIn");
const rateLimiter = require("./middleware/rateLimiter");
const cors = require("./middleware/cors");
const https = require("https");
const MongoStore = require("connect-mongo");
const fs = require("fs");
const apiConstructor = require("./api");
const config = require("./services/getConfig.js");

//define app
var app = express();

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

//rate limiter
app.use(rateLimiter);

//session config
app.use(
	session({
		cookie: { secure: true, httpOnly: true, samesite: true, maxAge: 600000, domain: config.domain },
		resave: false,
		saveUninitialized: false,
		name: "chevlanae.com.id",
		secret: config.sessionSecrets,
		store: MongoStore.create({
			mongoUrl: config.dbURL,
			crypto: {
				secret: config.storeSecret,
			},
		}),
	})
);

//middleware
app.use(cors); //cors handler
app.use(helmet()); //configure headers
app.use(bodyParser.json({ limit: "5mb" })); //define body-parser
app.use(favicon(__dirname + "/public/images/favicon.ico")); //serve favicon

//set routing defined in "./api/"
app = apiConstructor(app);

//require sign in for home page
app.use("/home/*", checkSignIn);

//public files
app.use("/", express.static("./public"));

//route all unmatched URLs to '/home'
app.all("*", checkSignIn, function (req, res) {
	res.redirect("/home/");
});

//https config
var options = {
	key: fs.readFileSync(config.SSL.key),
	cert: fs.readFileSync(config.SSL.cert),
};

var server = https.createServer(options, app);

server.listen(port, () => {
	console.log("Server started on port: " + port.toString());
});
