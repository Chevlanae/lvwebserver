import express from "express";

import { User } from "./models";
import { Config } from "./utils";
import { Types } from "mongoose";

declare global {
	var config: Config.Handler;
	var port: number;
}

declare module "express-session" {
	interface SessionData {
		username: string;
		email: string;
		mongoId: Types.ObjectId;
		roles: User.BaseType["permissions"]["roles"];
		isAuthenticated: boolean;
		emailVerified: boolean;
		secret: Buffer;
		tempData: any;
	}
}

declare namespace CustomResponse {
	namespace Body {
		export interface API {
			status: "OK" | "ERROR";
			message: string;
			errors?: Record<string, any>;
			data?: any;
		}
	}

	namespace SendSchema {
		export type API<T = express.Response> = (body?: Body.API) => T;
	}

	export interface API extends express.Response {
		json: SendSchema.API<this>;
	}
}
