//modules
import { checkSchema, matchedData } from "express-validator";
import express from "express";
import csurf from "csurf";
import { randomBytes } from "crypto";

import { User } from "../models";
import { validateParams, authCheck } from "../middleware";
import { CustomResponse } from "../types";
import { Temp, Email } from "../utils";

const authRouter = express.Router();

//*CSRF*//
authRouter.use(csurf());

//*LOGIN*//
authRouter.get("/login", function (req, res) {
	res.render("auth/login/index.pug", { csrfToken: req.csrfToken(), session: req.session });
});

authRouter.post(
	"/login",
	checkSchema({
		username: {
			in: ["query", "body"],
			exists: true,
			isString: true,
			trim: true,
		},
		password: {
			in: ["query", "body"],
			exists: true,
			isString: true,
			trim: true,
		},
	}),
	validateParams,
	async function (req: express.Request, res: CustomResponse.API) {
		let formData = matchedData(req, { locations: ["query", "body"] }), //match form data
			queriedUser = await User.Model.findOne({ username: formData.username }).exec(); //query db

		//query fails
		if (queriedUser === null)
			res.status(400).json({
				status: "ERROR",
				message: "Invalid Username",
				errors: [`User query failed. User "${formData.username}" does not exist.`],
			});
		//password matches
		else if (await queriedUser.checkPassword(formData.password)) {
			//set session data
			req.session.isAuthenticated = true;
			req.session.mongoId = queriedUser._id;
			req.session.username = queriedUser.username;
			req.session.email = queriedUser?.email?.value;
			req.session.emailVerified = queriedUser.email?.verified;
			req.session.secret = queriedUser.secret;
			req.session.roles = queriedUser.permissions.roles;
			req.session.tempData = Temp.handler(); //deletes any properties after 30 minutes

			//redirect to home
			res.status(200).redirect("../home");
		}
		//password does not match
		else
			res.status(400).json({
				status: "ERROR",
				message: "Invalid Password",
				errors: ["Provided password does not match stored hash"],
			});
	}
);

//*SIGNUP*//
authRouter.get("/signup", function (req, res) {
	res.render("auth/signup/index.pug", { csrfToken: req.csrfToken(), session: req.session });
});

authRouter.post(
	"/signup",
	checkSchema({
		email: {
			in: ["query", "body"],
			exists: true,
			isString: true,
			trim: true,
			isEmail: true,
			isLength: {
				errorMessage: "Email cannot be longer than 50 characters.",
				options: { max: 50 },
			},
		},
		username: {
			in: ["query", "body"],
			exists: true,
			isString: true,
			trim: true,
			isLength: {
				errorMessage: "Username must be between 5 and 30 characters long.",
				options: { min: 5, max: 30 },
			},
		},
		password: {
			in: ["query", "body"],
			exists: true,
			isString: true,
			trim: true,
			isLength: {
				errorMessage: "Password must be between 13 and 30 characters long.",
				options: { min: 13, max: 30 },
			},
			custom: {
				options: (value: string) => {
					//! Custom regex requirements
					//? format: [regex string, desired test result]
					let regex: [string, boolean][] = [
						[`[A-Z]`, true], //One capital letter
						[`[0-9]`, true], //One number
						[`[^a-zA-Z0-9_]`, true], //One special character
						[`/ `, false], //No spaces
					];

					return regex.every((regexOptions) => RegExp(regexOptions[0]).test(value) === regexOptions[1]);
				},
				errorMessage: "Missing either a capital letter, a number, a special character, or the password contains a space.",
			},
		},
	}),
	validateParams,
	async function (req: express.Request, res: CustomResponse.API) {
		let formData = matchedData(req, { locations: ["query", "body"] }), //match form data
			existingUser = await User.Model.findOne({ username: formData.username }).exec(); //query for a possible exising user

		//no existing user
		if (existingUser === null) {
			//create new user
			let newUser = new User.Model({
				username: formData.username,
				email: {
					value: formData.email,
					verified: false,
				},
			});

			//hash password
			await newUser.setPassword(formData.password);

			//save to db
			await newUser.save();

			//set session data
			req.session.isAuthenticated = true;
			req.session.emailVerified = newUser.email?.verified;
			req.session.username = newUser.username;
			req.session.roles = newUser.permissions.roles;
			req.session.mongoId = newUser._id;
			req.session.secret = newUser.secret;
			req.session.tempData = Temp.handler();

			console.log(req.session);

			//redirect to email confirmation page
			res.redirect("/signup/confirm/");
		}
		//existing user
		else
			res.status(400).json({
				status: "ERROR",
				message: "User already exists",
				errors: [`User "${formData.username}" already exists.`],
			});
	}
);

//*CONFIRM EMAIL*//
authRouter.get(
	"/signup/confirm",
	authCheck("user"),
	checkSchema({ token: { in: ["query", "body"], optional: true, isBase64: { options: { urlSafe: true } } } }),
	validateParams,
	async function (req: express.Request, res: express.Response) {
		let formData = matchedData(req, { locations: ["query", "body"] }), //match schema with received data
			receivedToken = Buffer.from(formData?.token || "", "base64url"), //Buffer created from received token, or empty string if there is none
			associatedToken = <Buffer>(req.session.tempData["emailToken"] || Buffer.from("", "utf-8")), //Token stored in req.session.tempData.emailToken
			user = await User.Model.findById(req.session["mongoId"]).exec(); //queried user

		//! Possible Errors

		//if query failed, return an error and render associated page in "/errors/"
		if (user === null)
			return res.status(500).render("/errors/boilerplate.pug", {
				status: 500,
				message: "User not found",
				errors: [`Could not find user with ID "${req.session.mongoId?.toString()}".`],
				session: req.session,
			});
		//if queried user has no set email (not likely), return an error and render associated page in "/errors/"
		else if (user.email === undefined)
			return res.status(500).render("/errors/boilerplate.pug", {
				status: 500,
				message: "No email associated with this user.",
				errors: [`User "${req.session["username"]}" does not have an email address associated with their account.`],
				session: req.session,
			});

		//! Main Operation

		//if no token, render index page
		if (formData?.token === undefined) res.render("auth/confirm/index.pug", { csrfToken: req.csrfToken() });
		//check if receivedToken is equal to associatedToken
		else if (receivedToken.equals(associatedToken)) {
			//save changes to db
			user.email.verified = true;
			await user.save();

			//set session data and redirect to /signup/confirm/success
			req.session.emailVerified = true;
			return res.redirect("/signup/confirm/success");
		}
		//if check fails, return an error and redirect to req.path
		else
			res.status(400).render("/errors/boilerplate.pug", {
				status: 400,
				message: "Invalid token",
				errors: [`Received token "${receivedToken}" does not match user's stored token.`],
				session: req.session,
			});
	}
);

authRouter.post("/signup/confirm", authCheck("user"), async function (req: express.Request, res: CustomResponse.API) {
	if (req.session.email === undefined)
		res.status(500).json({
			status: "ERROR",
			message: "No email associated with this user.",
			errors: [`User "${req.session.username}" does not have an email address associated with their account.`],
		});
	else if (req.session.emailVerified === true)
		res.status(400).json({
			status: "ERROR",
			message: "User's email is already verified",
			errors: [`User "${req.session.username}" already has a verified email address`],
		});
	else {
		let newToken = randomBytes(2 ** 6),
			transporter = new Email.Transporter("sendmail"),
			email = await transporter.send({
				to: req.session["email"],
				subject: "Verify your email",
				html: `<a href="https://${req.hostname}${req.baseUrl}${req.path}?token=${newToken.toString("base64url")}" target="_blank">Click here to verify your email.</a>`,
			});

		req.session.tempData["emailToken"] = newToken;

		res.json({
			status: "OK",
			message: `New token generated. An email containing the token has been sent to "${req.session.email}"`,
			data: {
				sendInfo: { ...email.envelope },
				messageId: email.messageId,
				response: email.response,
			},
		});
	}
});

authRouter.get("/signup/confirm/success", authCheck("user"), async function (req: express.Request, res: express.Response) {
	res.render("/auth/confirm/verified.pug", { redirect: req.session?.tempData["redirect"] || "/home", session: req.session });
});

//*REDIRECT ALL UNMATCHED ROUTES TO LOGIN*//
authRouter.get("*", function (req, res) {
	res.redirect("/login");
});

export default authRouter;
