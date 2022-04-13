const express = require("express");

var router = express.Router();

router.use("/auth", require("./authentication.js"));
router.use("/home", require("./home.js"));

module.exports = router;
