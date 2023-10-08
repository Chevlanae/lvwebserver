"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cors = exports.rateLimiter = exports.vaildateSession = exports.validateParams = exports.authCheck = exports.setSession = void 0;
const corsModule = require("cors");
const express_validator_1 = require("express-validator");
const rate_limiter_flexible_1 = require("rate-limiter-flexible");
const _ = __importStar(require("lodash"));
const utils_1 = require("./utils");
const setSession = function (req, res, next) {
    //set session data
    if (req.session.tempData === undefined) {
        req.session.tempData = utils_1.Temp.generate(); //deletes any properties after 30 minutes
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
    else {
        next();
    }
};
exports.validateParams = validateParams;
//holee shit batman, dynamic session validation
const vaildateSession = function (checks) {
    let middleware = function (req, res, next) {
        //iterate over each defined check value
        for (let [key, value] of Object.entries(checks)) {
            //If value is required, is not undefined, and has no defined reference, then pass and check next value
            if (value?.required === true && req.session[key] !== undefined && value.reference === undefined)
                continue;
            //Else if value is required, is not undefined, and has a defined reference
            else if (value?.required === true && req.session[key] !== undefined && value.reference !== undefined) {
                //Then, perform a deep comparison on the reference value and the actual value in req.session.
                //If the comparison succeeds, then pass and check next value.
                if (_.isEqual(value.reference, req.session[key]))
                    continue;
                //Else return and render an error page.
                else
                    return res.status(400).render("errors/boilerplate.pug", {
                        status: 400,
                        message: "Session validation failed.",
                        errors: [`Session property, "${key}" did not match expected pattern.`],
                        session: req.session,
                    });
                //Else if value is required, but is not defined, then return and render an error page
            }
            else if (value?.required === true && req.session[key] === undefined)
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
exports.vaildateSession = vaildateSession;
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