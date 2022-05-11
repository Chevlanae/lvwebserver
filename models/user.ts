import { Schema, Types, model, Model } from "mongoose";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";

import { PermissionsSchema, Permissions } from "./permissions";

export interface User {
	username: string;
	password?: string;
	email?: string;
	permissions: Permissions;
	verification: {
		verified: boolean;
		secret: Buffer;
	};
}

export interface UserDocumentProperties {
	permissions: Types.Subdocument<Types.ObjectId> & Permissions;
	setPassword(newPassword: string): Promise<void>;
	checkPassword(password: string): Promise<boolean>;
	verifyAccount(token: string): boolean;
}

export type UserModelType = Model<User, {}, UserDocumentProperties>;

export const UserSchema = new Schema<User, UserModelType, UserDocumentProperties>({
	username: { type: String, index: true, required: true },
	password: { type: String },
	email: { type: String },
	permissions: PermissionsSchema,
	verification: {
		verified: { type: Boolean, default: false, required: true },
		secret: { type: Buffer, default: randomBytes(2 ** 6), required: true },
	},
});

UserSchema.method("setPassword", async function (newPassword: string) {
	this.password = await argon2.hash(newPassword, {
		type: argon2.argon2id,
		memoryCost: 2 ** 16,
	});
});

UserSchema.method("checkPassword", async function (password: string) {
	return await argon2.verify(this?.password || "", password);
});

UserSchema.method("verifyAccount", function (token: string) {
	let receivedToken = Buffer.from(token, "base64url");

	if (receivedToken.equals(this.verification.secret)) this.verification.verified = true;

	return this.verification.verified;
});

export const User = model<User, UserModelType>("User", UserSchema);
