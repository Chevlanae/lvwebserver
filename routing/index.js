const express = require("express");
const authRouter = require("./authentication.js");

var router = express.Router();

router.use("/auth", authRouter);

module.exports = router;
