import express from "express";

import authRouter from "./authentication";
import homeRouter from "./home";
import userRouter from "./user";

const rootRouter = express.Router();

rootRouter.use("/auth", authRouter);
rootRouter.use("/home", homeRouter);
rootRouter.use("/user", userRouter);

export default rootRouter;
