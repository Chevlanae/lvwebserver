const { user, whitelist } = require("../models");
const { jsonResponse } = require("./utils/responses.js");
const { validateRequest } = require("../middleware");
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
	validateRequest,
	async function (req, res) {
		var userData = matchedData(req, { locations: ["body"] });

		var userObj = new user(userData.username, userData.password);

		//wait until authentication is complete
		while (!userObj.initComplete) {
			await new Promise((r) => setTimeout(r, 1));
		}

		if (userObj.auth.isAuthenticated) {
			//assign user roles
			var account = {};

			for (var listName of userObj.whitelists) {
				var list = new whitelist(listName);

				await list.check(userObj.document._id);

				if (list.onList) {
					account["is" + listName] = true;
				}
			}

			//set session data
			req.session.user = {
				username: userObj.username,
				account: account,
			};

			//set originaURL if one exists
			res.redirect(req.session.originalURL || "/home");
		} else if (userObj.auth.invalidUsername) {
			res.status(400).json(jsonResponse("Authentication Error", "Invalid Username"));
		} else if (userObj.auth.invalidPassword) {
			res.status(400).json(jsonResponse("Authentication Error", "Invalid Password"));
		} else {
			res.status(500).json(jsonResponse("Authentication Error", "Unknown cause"));
		}
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
	validateRequest,
	async function (req, res) {
		var userData = matchedData(req, { locations: ["body"] });

		var userObj = new user();

		userObj
			.create(userData.email, userData.username, userData.password)
			.then(
				//user DOES NOT exist in db
				(doc) => {
					res.redirect("/auth/login");
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
router.get("/signup/confirm", function (req, res) {
	res.send("not implemented");
});

router.post("/signup/confirm", body("emailConfirmToken").exists(), function (req, res) {
	return res.json(jsonResponse("not implemented", Error("NOT IMPLEMENTED")));
});

module.exports = router;
