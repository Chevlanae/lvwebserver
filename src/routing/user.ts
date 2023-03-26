import express from "express";
import { checkSchema, matchedData } from "express-validator";
import { User } from "../models";
import { authCheck, validateParams } from "../middleware";
import { ParameterSchemas } from "./authentication";

import { Routing } from "../types";

const userRouter = express.Router();

userRouter.use(authCheck("user"));

userRouter.get("/", function (req, res) {
	res.redirect("./" + req.session.username);
});

userRouter.get("/:name", function (req, res) {
	if (req.params.name !== req.session.username) res.render("user/nohack.pug");
	else res.render("user/index.pug", { session: req.session });
});

userRouter.post(
	"/change-username",
	checkSchema({
		newUsername: ParameterSchemas.signup.username,
	}),
	validateParams,
	async function (req: express.Request, res: Routing.Response.API) {
		let formData = matchedData(req, { locations: ["query", "body"] }),
			user = await User.Model.findById(req.session.mongoId).exec();

		if (user === null) {
			return res.status(400).json({
				status: "ERROR",
				message: "Invalid session token",
				errors: ["Associated ID did not return a valid query."],
			});
		} else {
			let oldUsername = user.username;
			user.username = formData.newUsername;
			await user.save();
			return res.json({ status: "OK", message: `Username successfully changed from ${oldUsername} to ${user.username}` });
		}
	}
);

userRouter.post(
	"/change-email",
	checkSchema({
		newEmail: ParameterSchemas.signup.email,
	}),
	validateParams,
	async function (req: express.Request, res: Routing.Response.API) {
		let formData = matchedData(req, { locations: ["query", "body"] }),
			user = await User.Model.findById(req.session.mongoId).exec();

		if (user === null) {
			return res.status(400).json({
				status: "ERROR",
				message: "Invalid session token",
				errors: ["Associated ID did not return a valid query."],
			});
		} else if (user.email === undefined) {
			return res.status(400).json({
				status: "ERROR",
				message: "No email associated with this user.",
			});
		} else {
			let oldEmail = user.email.value;
			user.email.value = formData.newEmail;
			user.email.verified = false;
			await user.save();
			return res.json({ status: "OK", message: `Email successfully changed from ${oldEmail} to ${user.email.value}` });
		}
	}
);

userRouter.post(
	"/change-password",
	checkSchema({
		oldPassword: ParameterSchemas.login.password,
		newPassword: ParameterSchemas.signup.password,
	}),
	validateParams,
	async function (req: express.Request, res: Routing.Response.API) {
		let formData = matchedData(req, { locations: ["query", "body"] }),
			user = await User.Model.findById(req.session.mongoId).exec();

		if (user === null)
			return res.status(400).json({
				status: "ERROR",
				message: "Invalid session token",
				errors: ["Associated ID did not return a valid query."],
			});
		else if (await user.checkPassword(formData.oldPassword)) {
			await user.setPassword(formData.newPassword);
			await user.save();
			res.json({
				status: "OK",
				message: "Password changed successfully.",
			});
		} else res.status(400).json({ status: "ERROR", message: "Old password did not match stored hash.", errors: { oldPassword: { msg: "Old password did not match stored hash." } } });
	}
);

userRouter.get("*", function (req, res) {
	res.redirect("./");
});
export default userRouter;
