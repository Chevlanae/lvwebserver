const User = require("../models/userModel.js");
const { jsonResponse } = require("./helpers/webWorkerResponses.js");
const { body, matchedData } = require("express-validator");
const checkSignIn = require("./helpers/checkSignIn.js");

const rootDir = "./";

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

			var userObj = new User(userData.username, userData.password);

			userObj.email = userData.email;

			userObj.save().then(
				//resolved
				(user) => {
					if (user.isAuthenticated) {
						req.session.user = user.username;
						var originURL = "/";
						if (req.session.originURL) {
							originURL = req.session.originURL; //if user came from a specific page, set redirect to originalURL
						}
						res.redirect(originURL);
					}
				},
				//rejected
				(user) => {
					if (user.isAuthenticated) {
						res.redirect("/");
					} else {
						res.status(400).json(jsonResponse("User already exists."));
					}
				}
			);
		}
	);

	app.get("/login", function (req, res) {
		res.sendFile("/html/login/index.html", { root: rootDir });
	});

	app.post("/login", body("username").exists().isString().escape(), body("password").exists().isString(), function (req, res) {
		var userData = matchedData(req, { locations: ["body"] });

		var userObj = new User(userData.username, userData.password);

		userObj.authenticate().then(() => {
			if (userObj.isAuthenticated) {
				req.session.user = userObj.username;
				var originURL = "/";
				if (req.session.originURL) {
					originURL = req.session.originURL;
				}
				res.redirect(302, originURL);
			} else {
				res.status(400).json(jsonResponse("Invalid username or password"));
			}
		});
	});

	app.get("/signup/confirm", checkSignIn, function (req, res) {
		res.send("not implemented");
	});

	app.post("/signup/confirm", body("emailConfirmToken").exists, function (req, res) {
		res.json(jsonResponse("not implemented", Error("NOT IMPLEMENTED")));
	});

	return app;
}

module.exports = authentication;
