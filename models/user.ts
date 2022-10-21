import { Schema, model, Model } from "mongoose";
import * as argon2 from "argon2";
import { randomBytes } from "crypto";

export namespace User {
	export interface BaseType {
		username: string;
		password?: string;
		email?: {
			value: string;
			verified: boolean;
		};
		permissions: {
			filesystem: {
				read: boolean;
				write: boolean;
			};
			roles: {
				user: boolean;
				superUser: boolean;
				admin: boolean;
				owner: boolean;
			};
		};
		secret: Buffer;
	}

	export interface DocumentMethods {
		setPassword(newPassword: string): Promise<void>;
		checkPassword(password: string): Promise<boolean>;
	}

	export type ModelType = Model<BaseType, {}, DocumentMethods>;

	export const ModelSchema = new Schema<BaseType, ModelType, DocumentMethods>({
		username: { type: String, index: true, required: true },
		password: { type: String },
		email: {
			value: { type: String, required: true },
			verified: { type: Boolean, default: false, required: true },
		},
		permissions: {
			filesystem: {
				read: { type: Boolean, default: false, required: true },
				write: { type: Boolean, default: false, required: true },
			},
			roles: {
				UserInterface: { type: Boolean, default: true, required: true },
				superUser: { type: Boolean, default: false, required: true },
				admin: { type: Boolean, default: false, required: true },
				owner: { type: Boolean, default: false, required: true },
			},
		},
		secret: { type: Buffer, default: randomBytes(512), required: true },
	});

	ModelSchema.method("setPassword", async function (newPassword: string) {
		this.password = await argon2.hash(newPassword, {
			type: argon2.argon2id,
			memoryCost: 2 ** 16,
		});
	});

	ModelSchema.method("checkPassword", async function (password: string) {
		return this?.password !== undefined && (await argon2.verify(this.password, password));
	});

	export const Model = model<BaseType, ModelType>("BaseType", ModelSchema);
}
