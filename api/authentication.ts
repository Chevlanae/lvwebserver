//modules
import { body, matchedData } from "express-validator";
import express from "express";
import csurf from "csurf";

import { User } from "../models/user";
import { validateParams, authCheck } from "../middleware";

const authRouter = express.Router();

authRouter.use(csurf());

////LOGIN
authRouter.get("/login", function (req, res) {
	res.render("auth/login/index.pug", { csrfToken: req.csrfToken() });
});

authRouter.post(
	"/login",
	body("username").exists().isString().trim().escape(),
	body("password").exists().isString().trim(),
	validateParams,
	async function (req, res) {
		//match form data
		let formData = matchedData(req, { locations: ["body"] });

		let queriedUser = await User.findOne({ username: formData.username }).exec();

		//user not found
		if (queriedUser === null) {
			res.status(400).json("Invalid username");

			//password matches
		} else if (await queriedUser.checkPassword(formData.password)) {
			//set session data
			req.session.isAuthenticated = true;
			req.session.verified = queriedUser.verification.verified;
			req.session.username = queriedUser.username;
			req.session.roles = queriedUser.permissions.roles;
			req.session.mongoId = queriedUser.id;
			req.session.secret = queriedUser.verification.secret;

			//redirect to original page, or home
			res.redirect(req.session.tempData["authCheckRedirect"] || "../home");
		} else {
			res.status(400).json("Invalid password");
		}
	}
);

////SIGNUP
authRouter.get("/signup", function (req, res) {
	res.render("auth/signup/index.pug", { csrfToken: req.csrfToken() });
});

authRouter.post(
	"/signup",
	body("email").exists().trim().isEmail(),
	body("username").exists().isString().trim().escape(),
	body("password").exists().isString().trim(),
	validateParams,
	async function (req, res) {
		//match form data
		let formData = matchedData(req, { locations: ["body"] });

		//search for existing users
		let existingUser = await User.findOne({ username: formData.username }).exec();

		if (existingUser === null) {
			let newUser = new User({
				username: formData.username,
				email: formData.email,
			});

			await newUser.setPassword(formData.password);

			await newUser.save();

			req.session.isAuthenticated = true;
			req.session.verified = newUser.verification.verified;
			req.session.username = newUser.username;
			req.session.roles = newUser.permissions.roles;
			req.session.mongoId = newUser.id;
			req.session.secret = newUser.verification.secret;

			res.redirect("/signup/confirm/");
		} else {
			res.status(400).json("User already exists");
		}
	}
);

////CONFIRM EMAIL
authRouter.get("/signup/confirm/:token", authCheck("user"), async function (req, res) {
	let token = Buffer.from(req.params.token, "base64url");

	if (req.session.secret?.equals(token)) {
		let user = await User.findById(req.session.mongoId).exec();

		if (user !== null) {
			req.session.verified = true;

			user.verification.verified = true;

			await user.save();

			res.render("/auth/confirm/verified.pug", { csrfToken: req.csrfToken(), redirect: req.session.tempData["authCheckRedirect"] || "../home" });
		} else {
			res.status(500).render("/errors/user-not-found");
		}
	} else {
		res.send("Not Implemented");
	}
});

authRouter.post("/signup/confirm/resend", authCheck("user"), async function (req, res) {
	res.send("Not Implemented");
});

////REDIRECT ALL UNMATCHED ROUTES TO LOGIN
authRouter.all("*", function (req, res) {
	res.redirect("/login");
});

export default authRouter;
