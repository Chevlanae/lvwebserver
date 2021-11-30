const { MongoClient } = require("mongodb");
const { RateLimiterMongo } = require("rate-limiter-flexible");
const config = require("../services/getConfig");

const mongoClient = MongoClient.connect(config.dbURL);

const opts = {
	storeClient: mongoClient,
	dbName: "lvwebserver",
	points: 10, // Number of points
	duration: 1, // Per second(s)
};

const rateLimiter = new RateLimiterMongo(opts);

const rateLimiterMiddlware = (req, res, next) => {
	rateLimiter
		.consume(req.ip)
		.then(() => {
			next();
		})
		.catch(() => {
			res.status(429).send("Too Many Requests");
		});
};

module.exports = rateLimiterMiddlware;
