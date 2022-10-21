import express from "express";

const homeRouter = express.Router();

homeRouter.get("/", function (req, res) {
	res.render("home/index.pug");
});

export default homeRouter;
