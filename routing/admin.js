const { validateRequest, authCheck } = require("../middleware");
const express = require("express");
const csurf = require("csurf");
const { User } = require("../models");

var router = express.Router();

router.use(csurf());

////LOGIN
router.get("/login", function (req, res) {
	res.render("admin/login/index", { csrfToken: req.csrfToken() });
});

router.post(
	"/login",
	body("username").exists().isString().trim().escape(),
	body("password").exists().isString().trim(),
	validateRequest,
	async function (req, res, next) {
		var formData = matchedData(req, { locations: ["body"] });

		//create new User object
		var user = new User();

		//authenticate credentials
		await user.authenticate(formData.password, { username: formData.username });

		//if authentication is successful
		if (user.isAuthenticated) {
			//if check operation succeeds
			if (user.permissions.role === "admin") {
				//set user session
				req.session.user = user;

				//redirect to originalURL if one exists, else /home
				res.redirect(req.session.originalURL || "/home");
			} else {
				res.status(500).json(jsonResponse("Authentication Error", "Unkown Error"));
			}
		} else if (user.invalidUsername) {
			res.status(400).json(jsonResponse("Authentication Error", "Invalid Username"));
		} else if (user.invalidPassword) {
			res.status(400).json(jsonResponse("Authentication Error", "Invalid Password"));
		} else {
			res.status(500).json(jsonResponse("Authentication Error", "Unknown cause"));
		}
	}
);

router.get("/home", authCheck("admin"), function (req, res) {
	res.render("admin/home/index");
});

router.get("*", authCheck("admin"), function (req, res) {
	res.redirect("/home");
});

module.exports = router;
