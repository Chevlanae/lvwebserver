const { adminAuthCheck } = require("../middleware");
const express = require("express");
const csurf = require("csurf");

var router = express.Router();

router.use(csurf());

////LOGIN
router.get("/", adminAuthCheck, function (req, res) {
	res.render("admin/index.pug", { csrfToken: req.csrfToken() });
});

router.get("/home", function (req, res) {
	res.render();
});

module.exports = router;
