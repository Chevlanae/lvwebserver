const User = require("../models/userModel.js");
const { jsonResponse } = require("./helpers/responses.js");
const middleware = require("../middleware");
const { body, matchedData } = require("express-validator");
const express = require("express");
const csurf = require("csurf");

var router = express.Router();

router.use(csurf());

////LOGIN
router.get("/login", function (req, res) {
	res.render("auth/login/index.pug", { csrfToken: req.csrfToken() });
});

router.post(
	"/login",
	body("username").exists().isString().trim().escape(),
	body("password").exists().isString().trim(),
	middleware.validateRequest,
	function (req, res) {
		var userData = matchedData(req, { locations: ["body"] });

		var userObj = new User(userData.username, userData.password);

		userObj
			.authenticate()
			.then(
				//authentication successful
				() => {
					if (userObj.isAuthenticated) {
						req.session.user = userObj.username;
						var originURL = "/";
						if (req.session.originURL) {
							originURL = req.session.originURL;
						}

						res.redirect(originURL);
					} else {
						res.status(500).json(jsonResponse("Authentication Error", "Unknown cause"));
					}
				},
				//authentication failed
				(result) => {
					if (result.invalidUsername) {
						res.status(400).json(jsonResponse("Authentication Error", "Invalid Username"));
					} else if (result.invalidPassword) {
						res.status(400).json(jsonResponse("Authentication Error", "Invalid Password"));
					} else {
						res.status(500).json(jsonResponse("Authentication Error", "Unknown cause"));
					}
				}
			)
			.catch((e) => {
				res.status(500).json(jsonResponse("Internal Server Error", e));
			});
	}
);

////SIGNUP
router.get("/signup", function (req, res) {
	res.render("auth/signup/index.pug", { csrfToken: req.csrfToken() });
});

router.post(
	"/signup",
	body("email").exists().isEmail(),
	body("username").exists().isString().trim().escape(),
	body("password").exists().isString().trim(),
	middleware.validateRequest,
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
router.get("/signup/confirm", csurf(), function (req, res) {
	res.send("not implemented");
});

router.post("/signup/confirm", middleware.authCheck, body("emailConfirmToken").exists(), function (req, res) {
	return res.json(jsonResponse("not implemented", Error("NOT IMPLEMENTED")));
});

module.exports = router;
