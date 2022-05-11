import express from "express";
import authRouter from "./authentication";

const rootRouter = express.Router();

rootRouter.use("/auth", authRouter);

export default rootRouter;
