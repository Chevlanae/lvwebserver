const corsModule = require("cors");

import type { CorsOptionsDelegate } from "cors";
import type mongoose from "mongoose";
import { RequestHandler } from "express";
import { validationResult } from "express-validator";
import { RateLimiterMongo } from "rate-limiter-flexible";
import * as _ from "lodash";

import { User } from "./models";
import { Routing } from "./types";
import { temp } from "./utils";
import { SessionData } from "express-session";

export const setSession: RequestHandler = function (req, res, next) {
	//set session data
	if (req.session.tempData === undefined) {
		req.session.tempData = temp(); //deletes any properties after 30 minutes
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

//holee shit batman, dynamic session validation
export const vaildateSession = function (checks: { [Property in keyof SessionData]?: { required: boolean; reference?: any } }) {
	let middleware: RequestHandler = function (req, res, next) {
		//iterate over each defined check value
		for (let [key, value] of Object.entries(checks)) {
			//If value is required, is not undefined, and has no defined reference, then pass and check next value
			if (value?.required === true && req.session[key] !== undefined && value.reference === undefined) continue;
			//Else if value is required, is not undefined, and has a defined reference
			else if (value?.required === true && req.session[key] !== undefined && value.reference !== undefined) {
				//Then, perform a deep comparison on the reference value and the actual value in req.session.
				//If the comparison succeeds, then pass and check next value.
				if (_.isEqual(value.reference, req.session[key])) continue;
				//Else return and render an error page.
				else
					return res.status(400).render("errors/boilerplate.pug", {
						status: 400,
						message: "Session validation failed.",
						errors: [`Session property, "${key}" did not match expected pattern.`],
						session: req.session,
					});

				//Else if value is required, but is not defined, then return and render an error page
			} else if (value?.required === true && req.session[key] === undefined)
				return res.status(500).render("errors/boilerplate.pug", {
					status: 500,
					message: "Session validation failed.",
					errors: [`Session data is missing required value "${key}"`],
				});
		}
		//once all checks are passed, call next()
		next();
	};

	return middleware;
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
