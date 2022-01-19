const { adminAuthCheck } = require("../middleware");
const express = require("express");
const csurf = require("csurf");
const { User } = require("../models")

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
			//create new List object and check user credentials agains the adminList
			var adminList = new List("admin"),
				checkResult = await adminList.check({ _id: user.id });

			//if check operation succeeds
			if (checkResult) {
				//set user session
				req.session.user = {...user.document, isAdmin: true};

				//else if check result is not null
			} else if (checkResult !== null) {
				res.status(401).json(jsonResponse("Authentication Error", "Access Denied"));

				//if null, the user lookup for the check operation has failed in some way
			} else {
				res.status(500).json(jsonResponse("Authentication Error", "Unkown Error"));
			}

			//redirect to originalURL if one exists, else /home
			res.redirect(req.session.originalURL || "/home");
		
		//
		} else if (user.invalidUsername) {
			res.status(400).json(jsonResponse("Authentication Error", "Invalid Username"));
		} else if (user.invalidPassword) {
			res.status(400).json(jsonResponse("Authentication Error", "Invalid Password"));
		} else {
			res.status(500).json(jsonResponse("Authentication Error", "Unknown cause"));
		}
	}		
);

router.get("/home", function (req, res) {
	res.render("admin/home/index");
});

router.get("*", adminAuthCheck, function(req, res){
	res.redirect("/home");
});

module.exports = router;
