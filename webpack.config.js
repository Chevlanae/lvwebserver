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
];
