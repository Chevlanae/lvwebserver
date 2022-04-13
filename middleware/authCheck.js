/**
 * Generates a function that checks requests for a user session that matches the given role, otherwise it redirects to the router's login page
 * @param {string | Array<string>} allowedRoles Whitelisted roles
 * @returns middleware function
 */
function authCheckMiddleware(...allowedRoles) {
	//force params into an array
	allowedRoles = typeof allowedRoles !== typeof [] ? [allowedRoles] : allowedRoles;

	return function (req, res, next) {
		if (req.session.user) {
			req.session.originalUrl = undefined;

			allowedRoles.forEach((allowedRole) => {
				//if allowedRole is a string
				typeof allowedRole === typeof "" &&
					//and it's a key in user.permissions
					allowedRole in req.session.user.permissions &&
					//and that key's value is true
					req.session.user.permissions[allowedRole] &&
					//call next handler
					next();
			});
		} else {
			req.session.originalUrl = req.originalUrl; //set originURL for redirect whenever user is authenticated
			res.redirect(`https://${req.hostname}/auth/login/`);
		}
	};
}

module.exports = authCheckMiddleware;
