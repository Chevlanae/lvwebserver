function checkSignIn(req, res, next) {
	if (req.session.admin) {
		if (req.session.originalUrl) {
			req.session.originalUrl = undefined; //if user is already authenticated, remove origin URL
		}
		next(); //If authenticated session exists, proceed to page
	} else {
		req.session.originalUrl = req.originalUrl; //set originURL for redirect whenever user is authenticated
		res.redirect("/admin");
	}
}

module.exports = checkSignIn;
