import { RateLimiterMongo } from "rate-limiter-flexible";
import mongoose from "mongoose";

import { RequestHandler } from "express";

const opts = {
	storeClient: mongoose.connect(config.dbURL),
	dbName: config.dbName,
	points: 10, // Number of points
	duration: 1, // Per second(s)
};

const rateLimiterModule = new RateLimiterMongo(opts);

export const rateLimiter: RequestHandler = function (req, res, next) {
	rateLimiterModule
		.consume(req.ip)
		.then(() => next())
		.catch(() => res.status(429).send("Too Many Requests"));
};
