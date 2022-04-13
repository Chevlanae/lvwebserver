const { Schema, model } = require("mongoose");
const argon2 = require("argon2");

const UserSchema = new Schema({
	username: { type: String, index: true },
	password: String,
	email: String,
	permissions: 
	verification: {
		verified: { type: Boolean, default: false },
		secret: String,
	},
});

UserSchema.methods.setPassword = function(newPassword) {
	argon2
		.hash(newPassword, {
			type: argon2.argon2id,
			memoryCost: 2 ** 16,
		})
		.then((hash) => (this.password = hash));
};
