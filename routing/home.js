const express = require("express");
const middleware = require("../middleware");

var router = express.Router();

router.get("/", middleware.authCheck, async (req, res) => {
	res.render("home/index.pug");
});

module.exports = router;
