//**dependencies**
const favicon = require("serve-favicon");
const session = require("express-session");

import helmet from "helmet";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import MongoStore from "connect-mongo";
import express from "express";
import fs from "fs";
import https from "https";
import path from "path";

import { Config } from "./utils";
import * as middleware from "./middleware";
import rootRouter from "./routing";

//**globals**
global.config = new Config();
global.port = 4443;

//**app**
const app = express();

//initialize db connection
mongoose.connect(config.dbURL).then((mg) => {
	app.use(middleware.rateLimiter(mg)); //rate limiter
});

//session config
app.use(
	session({
		cookie: { secure: true, httpOnly: true, samesite: true, maxAge: 600000, domain: config.domain },
		resave: true,
		saveUninitialized: true,
		name: config.domain + ".sid",
		secret: config.sessionSecret,
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
app.use(favicon("./public/images/favicon.ico")); //favicon
app.use(middleware.setSession);

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

let server = https.createServer(
	{
		key: fs.readFileSync(path.resolve(config.directoryPath + "/privkey.pem")),
		cert: fs.readFileSync(path.resolve(config.directoryPath + "/cert.pem")),
	},
	app
);

//listen on given port
server.listen(port, () => console.log("Server started on port " + port.toString()));
