"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cors = exports.rateLimiter = exports.validateParams = exports.authCheck = exports.setSession = void 0;
const corsModule = require("cors");
const express_validator_1 = require("express-validator");
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const utils_1 = require("./utils");
const setSession = function (req, res, next) {
    //set session data
    if (req.session.tempData === undefined) {
        req.session.tempData = utils_1.Temp.handler(); //deletes any properties after 30 minutes
    }
    next();
};
exports.setSession = setSession;
/**
 * Generates a function that checks req.session for isAuthenticated = true, and whitelists user roles with the given "...allowedRoles".
 * If isAuthenticated = false it redirects to the login page.
 * @param allowedRoles Whitelisted roles
 * @returns {RequestHandler} middleware function
 */
const authCheck = function (...allowedRoles) {
    let middleware = function (req, res, next) {
        if (req.session.isAuthenticated) {
            if (allowedRoles.some((allowedRole) => req.session.roles !== undefined && req.session.roles[allowedRole]))
                next();
            else
                res.status(403).render("errors/unauthorized.pug");
        }
        else {
            req.session.tempData.redirect = req.originalUrl;
            res.status(403).render("errors/login-required.pug", { redirect: req.originalUrl });
        }
    };
    return middleware;
};
exports.authCheck = authCheck;
/**
 * Runs validationResult() from express-validator, and either responds 400 with a JSON describing the incorrect parameters, or calls next()
 */
const validateParams = function (req, res, next) {
    const validationErrors = (0, express_validator_1.validationResult)(req);
    if (!validationErrors.isEmpty())
        res.status(400).json({ status: "ERROR", message: "Invalid Parameters", errors: validationErrors.mapped() });
    else
        next();
};
exports.validateParams = validateParams;
/**
 * Rate limiter that uses mongoDB as a store
 * @param {mongoose.Mongoose} client Mongoose client
 * @returns Ratelimiter middleware
 */
const rateLimiter = function (client) {
    const options = {
        storeClient: client.connection,
        dbName: config.dbName,
        points: 10,
        duration: 1, // Per second(s)
    };
    const rateLimiterModule = new rate_limiter_flexible_1.RateLimiterMongo(options);
    let middleware = function (req, res, next) {
        rateLimiterModule
            .consume(req.ip)
            .then(() => next())
            .catch(() => res.status(429).send("Too Many Requests"));
    };
    return middleware;
};
exports.rateLimiter = rateLimiter;
/**
 * Defines the allowed origins list for the cors module
 */
const corsOptions = (req, callback) => callback(null, { origin: config.originAllowList.some((value) => value === req.headers.origin) });
//generate cors middleware
exports.cors = corsModule(corsOptions);
//# sourceMappingURL=middleware.js.map