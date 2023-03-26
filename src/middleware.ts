const corsModule = require("cors");

import type { CorsOptionsDelegate } from "cors";
import type mongoose from "mongoose";
import { RequestHandler } from "express";
import { validationResult } from "express-validator";
import { RateLimiterMongo } from "rate-limiter-flexible";

import { User } from "./models";
import { Routing } from "./types";
import { Temp } from "./utils";

export const setSession: RequestHandler = function (req, res, next) {
	//set session data
	if (req.session.tempData === undefined) {
		req.session.tempData = Temp.handler(); //deletes any properties after 30 minutes
	}
	next();
};

/**
 * Generates a function that checks req.session for isAuthenticated = true, and whitelists user roles with the given "...allowedRoles".
 * If isAuthenticated = false it redirects to the login page.
 * @param allowedRoles Whitelisted roles
 * @returns {RequestHandler} middleware function
 */
export const authCheck = function (...allowedRoles: (keyof User.BaseType["permissions"]["roles"])[]) {
	let middleware: RequestHandler = function (req, res, next) {
		if (req.session.isAuthenticated) {
			if (allowedRoles.some((allowedRole) => req.session.roles !== undefined && req.session.roles[allowedRole])) next();
			else res.status(403).render("errors/unauthorized.pug");
		} else {
			req.session.tempData.redirect = req.originalUrl;
			res.status(403).render("errors/login-required.pug", { redirect: req.originalUrl });
		}
	};

	return middleware;
};

/**
 * Runs validationResult() from express-validator, and either responds 400 with a JSON describing the incorrect parameters, or calls next()
 */
export const validateParams: RequestHandler = function (req, res: Routing.Response.API, next) {
	const validationErrors = validationResult(req);

	if (!validationErrors.isEmpty()) res.status(400).json({ status: "ERROR", message: "Invalid Parameters", errors: validationErrors.mapped() });
	else next();
};

/**
 * Rate limiter that uses mongoDB as a store
 * @param {mongoose.Mongoose} client Mongoose client
 * @returns Ratelimiter middleware
 */
export const rateLimiter = function (client: mongoose.Mongoose) {
	const options = {
		storeClient: client.connection,
		dbName: config.dbName,
		points: 10, // Number of points
		duration: 1, // Per second(s)
	};

	const rateLimiterModule = new RateLimiterMongo(options);

	let middleware: RequestHandler = function (req, res, next) {
		rateLimiterModule
			.consume(req.ip)
			.then(() => next())
			.catch(() => res.status(429).send("Too Many Requests"));
	};

	return middleware;
};

/**
 * Defines the allowed origins list for the cors module
 */
const corsOptions: CorsOptionsDelegate = (req, callback) => callback(null, { origin: config.originAllowList.some((value) => value === req.headers.origin) });

//generate cors middleware
export const cors = corsModule(corsOptions);
