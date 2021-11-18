const User = require("../models/userModel.js");
const { jsonResponse } = require("./helpers/webWorkerResponses.js");
const { body, matchedData } = require("express-validator");
const checkSignIn = require("./helpers/checkSignIn.js");

const rootDir = "./";

function generateToken(length) {
	//edit the token allowed characters
	var a =
		"abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
	var b = [];
	for (var i = 0; i < length; i++) {
		var j = (Math.random() * (a.length - 1)).toFixed(0);
		b[i] = a[j];
	}
	return b.join("");
}

function authentication(app) {
	app.get("/signup", function (req, res) {
		res.sendFile("/html/signup/index.html", { root: rootDir });
	});

	app.post(
		"/signup",
		body("email").exists().isEmail(),
		body("username").exists().isString().escape(),
		body("password").exists().isString(),
		function (req, res) {
			var userData = matchedData(req, { locations: ["body"] });

			var userObj = new User();

			userObj.init(userData.username, userData.password).then((newUser) => {
				newUser.save().then((user) => {
					if (user.isAuthenticated && !user.alreadyExists) {
						req.session.user = user.username;
						req.session.resetToken = generateToken(32); ///please add a confirm email workflow
						var originURL = "/";
						if (req.session.originURL) {
							originURL = req.session.originURL; //if user came from a specific page, set redirect to originalURL
						}
						res.status(201).redirect(originURL);
					} else if (user.alreadyExists) {
						res.status(400).json(jsonResponse("User already exists"));
					}
				});
			});
		}
	);

	app.get("/login", function (req, res) {
		res.sendFile("/html/login/index.html", { root: rootDir });
	});

	app.post(
		"/login",
		body("username").exists().isString().escape(),
		body("password").exists().isString(),
		function (req, res) {
			var userData = matchedData(req, { locations: ["body"] });

			var userObj = new User();

			userObj.init(userData.username, userData.password).then((user) => {
				if (user.isAuthenticated) {
					req.session.user = unescape(user.username);
					var originURL = "/";
					if (req.session.originURL) {
						originURL = req.session.originURL;
					}
					res.redirect(originURL);
				} else {
					res.status(400).json(jsonResponse("Invalid username or password"));
				}
			});
		}
	);

	app.get("/signup/confirm", checkSignIn, function (req, res) {
		res.send("not implemented");
	});

	app.post(
		"/signup/confirm",
		body("emailConfirmToken").exists,
		function (req, res) {
			res.json(jsonResponse("not implemented", Error("NOT IMPLEMENTED")));
		}
	);

	return app;
}

module.exports = authentication;
