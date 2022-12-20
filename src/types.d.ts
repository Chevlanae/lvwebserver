import express from "express";

import { User } from "./models";
import { Config } from "./utils";
import { Types } from "mongoose";
import session from "express-session";

declare global {
	var config: Config.Handler;
	var port: number;
}

declare module "express" {
	export interface Response {
		render(
			view: string,
			options?: {
				status?: number;
				message?: string;
				errors?: string[];
				csrfToken?: string;
				session: session.Session & Partial<session.SessionData>;
			},
			callback?: (err: Error, html: string) => void
		): void;
		render(view: string, callback?: (err: Error, html: string) => void): void;
	}
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

declare namespace Routing {
	namespace JSONSchemas {
		export type API = {
			status: "OK" | "ERROR";
			message: string;
			errors?: Record<string, any>;
			data?: any;
		};
	}

	namespace Methods {
		export type API_json<T = express.Response> = (body?: JSONSchemas.API) => T;
	}

	export namespace Response {
		export interface API extends express.Response {
			json: Methods.API_json<this>;
		}
	}
}
