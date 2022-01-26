const { User } = require("../models");
const { jsonResponse } = require("./utils/responses");
const { validateRequest, authCheck } = require("../middleware");
const email = require("../services/email/email");
const { body, matchedData } = require("express-validator");
const express = require("express");
const csurf = require("csurf");
const secureRandom = require("secure-random");

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
		//match form data
		var formData = matchedData(req, { locations: ["body"] });

		//create new User object
		var user = new User();

		//authenticate credentials
		await user.authenticate(formData.password, { username: formData.username });

		//if authentication is successful
		if (user.isAuthenticated) {
			//if user is verified
			if (user.verification.verified) {
				//set user session
				req.session.user = user;

				//redirect to originalURL if one exists, else ../home
				res.redirect(req.session.originalUrl || "../home");
			}
			//if null, the user lookup for the check operation has failed in some way
			else {
				res.status(500).json(jsonResponse("Authentication Error", "User is not verified"));
			}
		} else if (userObj.invalidUsername) {
			res.status(400).json(jsonResponse("Authentication Error", "Invalid Username"));
		} else if (userObj.invalidPassword) {
			res.status(400).json(jsonResponse("Authentication Error", "Invalid Password"));
		} else {
			res.status(500).json(jsonResponse("Authentication Error", "Unknown Error"));
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
		//match form data
		var formData = matchedData(req, { locations: ["body"] });

		//create new User object
		var user = new User();

		//create new user entry in DB
		await user.create({ username: formData.username, password: formData.password, email: formData.email });

		//if user does not already exist
		if (!user.alreadyExists) {
			//set user session
			req.session.user = user;

			//redirect to email verification page
			res.redirect("/signup/confirm/");
		}
		//if user already exists
		else {
			res.status(400).json(jsonResponse("DB Error", "User already exists."));
		}
	}
);

////CONFIRM EMAIL
router.get("/signup/confirm/:token", authCheck("user"), async function (req, res) {
	if (req.session.verificationToken) {
		try {
			var token = Buffer.from(req.params.token, "base64url");
		} catch (e) {
			res.status(400).json(jsonResponse("Invalid token", e));
		}

		if (token.equals(req.session.verificationToken)) {
			req.session.user.verified = true;
			res.render("auth/confirm/verified.pug", { csrfToken: req.csrfToken(), redirect: req.session.originalUrl || "/home" });
		} else {
			res.status(400).json(jsonResponse("Invalid token", req.params.token));
		}
	} else {
		req.session.verificationToken = secureRandom.randomBuffer(64);

		await email(req.session.user.email, "Verify you email address", "signup_confirm.html", {
			verificationToken: req.session.verificationToken.toString("base64url"),
		});

		res.render("auth/confirm/index.pug", { csrfToken: req.csrfToken() });
	}
});

router.post("/signup/confirm/resend", authCheck("user"), async function (req, res) {
	req.session.verificationToken = secureRandom.randomBuffer(64);

	await email(req.session.user.email, "Verify you email address", "signup_confirm.html", {
		verificationToken: req.session.verificationToken.toString("base64url"),
	});

	res.json(jsonResponse("Resent Email"));
});

////REDIRECT ALL UNMATCHED ROUTES TO LOGIN
router.all("*", function (req, res) {
	res.redirect("/login");
});

module.exports = router;
