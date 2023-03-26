"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const middleware_1 = require("../middleware");
const userRouter = express_1.default.Router();
userRouter.use((0, middleware_1.authCheck)("user"));
userRouter.get("/", function (req, res) {
    res.redirect("./" + req.session.username);
});
userRouter.get("/:name", function (req, res) {
    if (req.params.name !== req.session.username)
        res.render("user/nohack.pug");
    else
        res.render("user/index.pug", { session: req.session });
});
userRouter.get("*", function (req, res) {
    res.redirect("./");
});
exports.default = userRouter;
