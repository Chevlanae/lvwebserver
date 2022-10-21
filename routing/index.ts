import express from "express";

import authRouter from "./authentication";
import homeRouter from "./home";

const rootRouter = express.Router();

rootRouter.use("/auth", authRouter);
rootRouter.use("/home", homeRouter);

export default rootRouter;
