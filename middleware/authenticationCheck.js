//authorization check
function checkSignIn(req, res, next) {
	if (req.session.user) {
		if (req.session.originURL) {
			req.session.originURL = undefined; //if user is already authenticated, remove origin URL
		}
		next(); //If authenticated session exists, proceed to page
	} else {
		req.session.originURL = req.originURL; //set originURL for redirect whenever user is authenticated
		res.redirect("/auth/login/");
	}
}

module.exports = checkSignIn;
