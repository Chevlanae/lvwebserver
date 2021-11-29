const User = require("../models/userModel.js");
const { jsonResponse } = require("./helpers/webWorkerResponses.js");
const validateRequest = require("../middlware/validateRequest.js");
const { body, matchedData } = require("express-validator");
const checkSignIn = require("../middlware/checkSignIn.js");

function authentication(app) {
	////LOGIN
	app.post(
		"/login",
		body("username").exists().isString().trim().escape(),
		body("password").exists().isString().trim(),
		validateRequest,
		function (req, res) {
			var userData = matchedData(req, { locations: ["body"] });

			var userObj = new User(userData.username, userData.password);

			userObj.authenticate().then(() => {
				if (userObj.isAuthenticated) {
					req.session.user = userObj.username;
					var originURL = "/";
					if (req.session.originURL) {
						originURL = req.session.originURL;
					}

					return res.redirect(originURL);
				} else {
					if (userObj.invalidUsername) {
						return res.json(jsonResponse("Invalid Username"));
					} else if (userObj.invalidPassword) {
						return res.json(jsonResponse("Invalid Password"));
					}
				}
			});
		}
	);

	////SIGNUP
	app.post(
		"/signup",
		body("email").exists().isEmail(),
		body("username").exists().isString().trim().escape(),
		body("password").exists().isString().trim(),
		validateRequest,
		function (req, res) {
			var userData = matchedData(req, { locations: ["body"] });

			var userObj = new User(userData.username, userData.password);

			userObj.email = userData.email;

			userObj.save().then(
				//user DOES NOT exist in db
				() => {
					res.redirect("/login");
				},
				//user DOES exist in db
				() => {
					res.status(400).json(jsonResponse("User already exists."));
				}
			);
		}
	);

	////CONFIRM EMAIL
	app.get("/signup/confirm", checkSignIn);

	app.post("/signup/confirm", checkSignIn, body("emailConfirmToken").exists(), function (req, res) {
		return res.json(jsonResponse("not implemented", Error("NOT IMPLEMENTED")));
	});

	return app;
}

module.exports = authentication;
