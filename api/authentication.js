const UserModel = require("../models/userModel.js");
const { body, matchedData } = require("express-validator");

const rootDir = "./";
function setAuthentication(app) {
	app.get("/signup", function (req, res) {
		res.sendFile("/html/signup/index.html", { root: rootDir });
	});

	app.post(
		"/signup",
		body("username").isString().escape(),
		body("password").isString(),
		function (req, res) {
			var userData = matchedData(req, { locations: ["body"] });

			if (!("username" in userData && "password" in userData)) {
				res.status(400).json(); //put stupid json format thing here
			}

			var user = new UserModel(userData.username, userData.password);

			user.save();

			if (user.alreadyExists) {
				res.status(400).json(); //put stupid json format thing here
			} else {
				req.session.user = user;
				res.status(201).json(); //put stupid json format thing here
			}
		}
	);

	app.get("/login", function (req, res) {
		res.sendFile("/html/login/index.html", { root: rootDir });
	});

	app.post(
		"/login",
		body("username").isString().escape(),
		body("password").isString(),
		function (req, res) {
			var userData = matchedData(req, { locations: ["body"] });

			var user = new UserModel(userData.username, UserData.password);

			user.authenticate();

			if (user.isAuthenticated) {
				req.session.user = user;
				res.status(200).json(); //put stupid json format thing here
			} else {
				res.status(400).json();
			}
		}
	);

	return app;
}

module.exports = setAuthentication;
