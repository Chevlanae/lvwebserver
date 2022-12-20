"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authentication_1 = __importDefault(require("./authentication"));
const home_1 = __importDefault(require("./home"));
const rootRouter = express_1.default.Router();
rootRouter.use("/auth", authentication_1.default);
rootRouter.use("/home", home_1.default);
exports.default = rootRouter;
