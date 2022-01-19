//##dependencies##
const https = require("https");
const fs = require("fs");
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const helmet = require("helmet");
const bodyParser = require("body-parser");
const favicon = require("serve-favicon");

//##local imports##
const middleware = require("./middleware");
const rootRouter = require("./routing");
const config = require("./services/config");

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

//default args
port = port || 4443;

//define app
var app = express();

//rate limiter
app.use(middleware.rateLimiter);

//session config
app.use(
	session({
		cookie: { secure: true, httpOnly: true, samesite: true, maxAge: 600000, domain: config.domain },
		resave: true,
		saveUninitialized: true,
		name: config.domain + ".id",
		secret: config.sessionSecrets,
		store: MongoStore.create({
			mongoUrl: config.dbURL,
			crypto: {
				secret: config.storeSecret,
			},
		}),
	})
);

//misc middleware
app.use(middleware.cors); //cors handler
app.use(helmet()); //security headers
app.use(bodyParser.json({ limit: "5mb" })); //json only body-parser
app.use(favicon(__dirname + "/public/images/favicon.ico")); //favicon

//views
app.set("view engine", "pug");
app.set("views", "./views");

//routing
app.use("/", rootRouter);

//public files
app.use("/public", express.static("./public"));

//route all unmatched URLs to '/home'
app.get("*", function (req, res) {
	res.redirect("/home");
});

//https config
var options = {
	key: fs.readFileSync(config.SSL_key),
	cert: fs.readFileSync(config.SSL_cert),
};

//listen on port 4443 default, or specified via '--port' parameter on process execution
var server = https.createServer(options, app);

server.listen(port, () => {
	console.log("Server started on port: " + port.toString());
});
