const { Schema, model } = require("mongoose");

const UserPermissions = new Schema({
	id: String,
	user: {
		assigned: { type: Boolean, default: false },
		filesystem: {
			home: String,
			read: { type: Boolean, default: false },
			write: { type: Boolean, default: false },
		},
	},
	superUser: {
		assigned: { type: Boolean, default: false },
	},
	admin: {
		assigned: { type: Boolean, default: false },
	},
	owner: {
		assigned: { type: Boolean, default: false },
	},
});
