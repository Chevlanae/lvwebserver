const express = require("express");
const authRouter = require("./authentication.js");
const adminRouter = require("./admin.js");
const homeRouter = require("./home.js");

var router = express.Router();

router.use("/auth", authRouter);
router.use("/admin", adminRouter);
router.use("/home", homeRouter);

module.exports = router;
