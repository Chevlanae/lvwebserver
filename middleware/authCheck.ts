import { RequestHandler } from "express";
import { PermissionsModel } from "../models";

/**
 * Generates a function that checks requests for a user session that matches the given role, otherwise it redirects to the router's login page
 * @param {Array<Role>} allowedRoles Whitelisted roles
 * @returns {RequestHandler} middleware function
 */
export const authCheck = function (...allowedRoles: PermissionsModel.Roles[]) {
	let middleware: RequestHandler = function (req, res, next) {
		if (req.session.isAuthenticated) {
			if (allowedRoles.some((allowedRole) => req.session.roles !== undefined && req.session.roles[allowedRole])) {
				next();
			} else {
				res.status(403).render("/errors/unauthorized.pug");
			}
		} else {
			req.session.tempData.authCheckRedirect = req.originalUrl;
			res.redirect(`https://${req.hostname}/auth/login/`);
		}
	};

	return middleware;
};
