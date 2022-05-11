import { Schema, model, Model, Types } from "mongoose";

export interface Permissions {
	_id: Types.ObjectId;
	filesystem: {
		home: string;
		readPermission: boolean;
		writePermission: boolean;
	};
	roles: {
		user: boolean;
		superUser: boolean;
		admin: boolean;
		owner: boolean;
	};
}

export interface PermissionsDocumentProperties {
	memberOf(role: Roles): boolean;
	listRoles(): string[];
	addRole(role: Roles): string[];
	removeRole(role: Roles): string[];
}

export type PermissionsModelType = Model<Permissions, {}, PermissionsDocumentProperties>;

export type Roles = keyof Permissions["roles"];

export const PermissionsSchema = new Schema<Permissions, PermissionsModelType, PermissionsDocumentProperties>({
	filesystem: {
		home: { type: String, default: "/users", required: true },
		readPermission: { type: Boolean, default: false, required: true },
		writePermission: { type: Boolean, default: false, required: true },
	},
	roles: {
		user: { type: Boolean, default: true, required: true },
		superUser: { type: Boolean, default: false, required: true },
		admin: { type: Boolean, default: false, required: true },
		owner: { type: Boolean, default: false, required: true },
	},
});

PermissionsSchema.method("memberOf", function (role: Roles) {
	return role in this.roles;
});

PermissionsSchema.method("listRoles", function () {
	return Object.keys(this.roles).filter((value) => this.roles[value]);
});

PermissionsSchema.method("addRole", function (role: Roles) {
	this.roles[role] = true;
	return Object.keys(this.roles).filter((value) => this.roles[value]);
});

PermissionsSchema.method("removeRole", function (role: Roles) {
	this.roles[role] = false;
	return Object.keys(this.roles).filter((value) => this.roles[value]);
});

export const Permissions = model<Permissions, PermissionsModelType>("Permissions", PermissionsSchema);
