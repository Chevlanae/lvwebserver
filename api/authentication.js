const User = require("../models/userModel.js");
const { jsonResponse } = require("./helpers/responses.js");
const validateRequest = require("../middleware/validateRequest.js");
const { body, matchedData } = require("express-validator");
const checkSignIn = require("../middleware/checkSignIn.js");

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

			userObj
				.authenticate()
				.then(
					() => {
						req.session.user = userObj.username;
						var originURL = "/";
						if (req.session.originURL) {
							originURL = req.session.originURL;
						}

						res.redirect(originURL);
					},
					(result) => {
						if (result.invalidUsername) {
							res.json(jsonResponse("Authentication Error", "Invalid Username"));
						} else if (result.invalidPassword) {
							res.json(jsonResponse("Authentication Error", "Invalid Password"));
						} else {
							res.status(500).json(jsonResponse("Internal Server Error", "Authentication Error: Unknown cause."));
						}
					}
				)
				.catch((e) => {
					res.status(500).json(jsonResponse("Internal Server Error", e));
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

			userObj
				.save()
				.then(
					//user DOES NOT exist in db
					() => {
						res.redirect("/login/");
					},
					//user DOES exist in db
					() => {
						res.status(400).json(jsonResponse("DB Error", "User already exists."));
					}
				)
				.catch((e) => {
					res.status(500).json(jsonResponse("Internal Server Error", e));
				});
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
