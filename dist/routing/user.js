"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_validator_1 = require("express-validator");
const models_1 = require("../models");
const middleware_1 = require("../middleware");
const schemas_1 = require("../schemas");
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
userRouter.post("/change-username", (0, express_validator_1.checkSchema)({
    newUsername: schemas_1.Parameters.signup.username,
}), middleware_1.validateParams, async function (req, res) {
    let formData = (0, express_validator_1.matchedData)(req, { locations: ["query", "body"] }), user = await models_1.User.Model.findById(req.session.mongoId).exec();
    if (user === null) {
        return res.status(400).json({
            status: "ERROR",
            message: "Invalid session token",
            errors: ["Associated ID did not return a valid query."],
        });
    }
    else {
        let oldUsername = user.username;
        user.username = formData.newUsername;
        await user.save();
        return res.json({ status: "OK", message: `Username successfully changed from ${oldUsername} to ${user.username}` });
    }
});
userRouter.post("/change-email", (0, express_validator_1.checkSchema)({
    newEmail: schemas_1.Parameters.signup.email,
}), middleware_1.validateParams, async function (req, res) {
    let formData = (0, express_validator_1.matchedData)(req, { locations: ["query", "body"] }), user = await models_1.User.Model.findById(req.session.mongoId).exec();
    if (user === null) {
        return res.status(400).json({
            status: "ERROR",
            message: "Invalid session token",
            errors: ["Associated ID did not return a valid query."],
        });
    }
    else if (user.email === undefined) {
        return res.status(400).json({
            status: "ERROR",
            message: "No email associated with this user.",
        });
    }
    else {
        let oldEmail = user.email.value;
        user.email.value = formData.newEmail;
        user.email.verified = false;
        await user.save();
        return res.json({ status: "OK", message: `Email successfully changed from ${oldEmail} to ${user.email.value}` });
    }
});
userRouter.post("/change-password", (0, express_validator_1.checkSchema)({
    oldPassword: schemas_1.Parameters.login.password,
    newPassword: schemas_1.Parameters.signup.password,
}), middleware_1.validateParams, async function (req, res) {
    let formData = (0, express_validator_1.matchedData)(req, { locations: ["query", "body"] }), user = await models_1.User.Model.findById(req.session.mongoId).exec();
    if (user === null)
        return res.status(400).json({
            status: "ERROR",
            message: "Invalid session token",
            errors: ["Associated ID did not return a valid query."],
        });
    else if (await user.checkPassword(formData.oldPassword)) {
        await user.setPassword(formData.newPassword);
        await user.save();
        res.json({
            status: "OK",
            message: "Password changed successfully.",
        });
    }
    else
        res.status(400).json({ status: "ERROR", message: "Old password did not match stored hash.", errors: { oldPassword: { msg: "Old password did not match stored hash." } } });
});
userRouter.get("*", function (req, res) {
    res.redirect("./");
});
exports.default = userRouter;
//# sourceMappingURL=user.js.map