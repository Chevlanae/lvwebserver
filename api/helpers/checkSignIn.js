//authorization check
function checkSignIn(req, res, next) {
	if (req.session.user) {
		if (req.session.originURL) {
			req.session.originURL = undefined;
		}
		next(); //If authenticated session exists, proceed to page
	} else {
		req.session.originURL = req.originURL;
		res.redirect("/login");
	}
}

module.exports = checkSignIn;
