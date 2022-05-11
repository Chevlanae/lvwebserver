//##local imports##
import * as middleware from "./middleware";
import { Config } from "./services";
import { Permissions } from "./models/permissions";

//##dependencies##
const favicon = require("serve-favicon");
const session = require("express-session");

import fs from "fs";
import https from "https";
import express from "express";
import helmet from "helmet";
import bodyParser from "body-parser";
import { ObjectId } from "mongoose";
import MongoStore from "connect-mongo";
import mongoose from "mongoose";

//##declarations##
declare global {
	var config: Config;
}

declare module "express-session" {
	interface SessionData {
		username: string;
		mongoId: ObjectId;
		roles: Permissions["roles"];
		isAuthenticated: boolean;
		verified: boolean;
		secret: Buffer;
		tempData: any;
	}
}

//db
mongoose.connect(config.dbURL);

//config
global.config = new Config();

//default args
var port = 4443;

//app
var app: express.Application = express();

//session
app.use(
	session({
		cookie: { secure: true, httpOnly: true, samesite: true, maxAge: 600000, domain: config.domain },
		resave: true,
		saveUninitialized: true,
		name: config.domain + ".sid",
		secret: config.sessionSecrets,
		store: MongoStore.create({
			mongoUrl: config.dbURL,
			crypto: {
				secret: config.storeSecret.toString("base64url"),
			},
		}),
	})
);

//rate limiter
app.use(middleware.rateLimiter);

//misc middleware
app.use(middleware.cors); //cors handler
app.use(helmet()); //security headers
app.use(bodyParser.json({ limit: "5mb" })); //json only body-parser
app.use(favicon(__dirname + "/public/images/favicon.ico")); //favicon

//views
app.set("view engine", "pug");
app.set("views", "./views");

import rootRouter from "./api";

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
	key: fs.readFileSync(config.sslDir + "/privkey.pem"),
	cert: fs.readFileSync(config.sslDir + "/cert.pem"),
};

var server = https.createServer(options, app);

server.listen(port, () => {
	console.log("Server started on port: " + port.toString());
});
