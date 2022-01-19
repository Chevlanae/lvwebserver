const { User, List } = require("../models");
const { jsonResponse } = require("./utils/responses.js");
const { validateRequest } = require("../middleware");
const { body, matchedData } = require("express-validator");
const express = require("express");
const csurf = require("csurf");
const { email } = require("../services");

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
	async function (req, res, next) {
		var formData = matchedData(req, { locations: ["body"] });

		//create new User object
		var user = new User();

		//authenticate credentials
		await user.authenticate(formData.password, { username: formData.username });

		//if authentication is successful
		if (user.isAuthenticated) {
			//create new List object and check user credentials agains the userList
			var userList = new List("user"),
				checkResult = await userList.check({ _id: user.id });

			//if check operation succeeds
			if (checkResult) {
				//set user session
				req.session.user = user.document;

				//else if check result is not null
			} else if (checkResult !== null) {
				res.status(401).json(jsonResponse("Authentication Error", "Access Denied"));

				//if null, the user lookup for the check operation has failed in some way
			} else {
				res.status(500).json(jsonResponse("Authentication Error", "Unkown Error"));
			}

			//redirect to originalURL if one exists, else /home
			res.redirect(req.session.originalURL || "/home");
		} else if (userObj.invalidUsername) {
			res.status(400).json(jsonResponse("Authentication Error", "Invalid Username"));
		} else if (userObj.invalidPassword) {
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
	body("email").exists().trim().isEmail(),
	body("username").exists().isString().trim().escape(),
	body("password").exists().isString().trim(),
	validateRequest,
	async function (req, res, next) {
		var formData = matchedData(req, { locations: ["body"] });

		var user = new User();

		await user.create({ username: formData.username, password: formData.password });

		if (!user.alreadyExists) {
			req.session.user = user.document;

			var options = { templateVariables: { verificationToken: user.document.verification.token } };
			email(user.email, "Confirm your account.", "emails/auth/confirm", options);
		} else {
			res.status(400).json(jsonResponse("DB Error", "User already exists."));
		}
	}
);

////CONFIRM EMAIL
router.get("/signup/confirm", function (req, res) {
	res.render("auth/confirm/index.pug");
});

router.post("/signup/confirm", body("emailConfirmToken").exists(), function (req, res) {
	return res.json(jsonResponse("not implemented", Error("NOT IMPLEMENTED")));
});

////ALL UNMATCHED ROUTES TO LOGIN
router.get("*", function (req, res) {
	res.redirect("/login");
});

module.exports = router;
