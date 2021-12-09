const https = require("https");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const favicon = require("serve-favicon");
const middleware = require("./middleware");
const rootRouter = require("./routing");
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

port = port === undefined ? 4443 : port;

//rate limiter
app.use(middleware.rateLimiter);

//session config
app.use(
	session({
		cookie: { secure: true, httpOnly: true, samesite: true, maxAge: 600000, domain: config.domain },
		resave: false,
		saveUninitialized: true,
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
app.use(middleware.cors); //cors handler
app.use(helmet()); //configure headers
app.use(bodyParser.json({ limit: "5mb" })); //define body-parser
app.use(favicon(__dirname + "/public/images/favicon.ico")); //serve favicon

//set views
app.set("view engine", "pug");
app.set("views", "./views");

//set routing
app.use("/", rootRouter);

//require sign in for home page
app.use("/home/*", middleware.authCheck);

//public files
app.use("/public", express.static("./public"));

//route all unmatched URLs to '/home'
app.all("*", middleware.authCheck, function (req, res) {
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
