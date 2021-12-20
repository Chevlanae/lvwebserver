const { user, whitelist } = require("../models");
const { jsonResponse } = require("./helpers/responses.js");
const { validateRequest } = require("../middleware");
const { body, matchedData } = require("express-validator");
const express = require("express");
const csurf = require("csurf");

var router = express.Router();

router.use(csurf());

////LOGIN
router.get("/", function (req, res) {
	res.render("admin/index.pug", { csrfToken: req.csrfToken() });
});

router.post(
	"/",
	body("username").exists().isString().trim().escape(),
	body("password").exists().isString().trim(),
	validateRequest,
	function (req, res) {
		var userData = matchedData(req, { locations: ["body"] });

		var userObj = new user();

		userObj
			.authenticate(userData.username, userData.password)
			.then(
				//authentication successful
				(doc) => {
					var list = new whitelist("admin");

					list
						.check(userData.username)
						.then(
							(result) => {
								req.session.admin = userData.username;
								res.redirect("/admin/home");
							},
							(result) => {
								if (result.notOnList) {
									res.status(400).json(jsonResponse("Authentication Error", "User is not an admin"));
								} else {
									res.status(500).json(jsonResponse("Authentication Error", "Unknown cause"));
								}
							}
						)
						.catch((e) => {
							res.status(500).json(jsonResponse("Internal Server Error", e));
						});
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

router.get("/home", function (req, res) {
	res.render("admin/home/index.pug");
});

module.exports = router;
