const path = require("path");

module.exports = [
	{
		name: "login",
		entry: "./views/auth/login/src/index.js",
		mode: "production",
		output: {
			filename: "login.js",
			path: path.resolve(__dirname, "public/scripts/auth/"),
		},
	},
	{
		name: "signup",
		entry: "./views/auth/signup/src/index.js",
		mode: "production",
		output: {
			filename: "signup.js",
			path: path.resolve(__dirname, "public/scripts/auth/"),
		},
	},
	{
		name: "confirm",
		entry: "./views/auth/confirm/src/index.js",
		mode: "production",
		output: {
			filename: "confirm.js",
			path: path.resolve(__dirname, "public/scripts/auth/"),
		},
	},
	{
		name: "admin",
		entry: "./views/admin/src/index.js",
		mode: "production",
		output: {
			filename: "admin.js",
			path: path.resolve(__dirname, "public/scripts/admin/"),
		},
	},
];
