const path = require("path");

module.exports = [
	{
		name: "login",
		entry: "./public/login/src/index.js",
		mode: "production",
		output: {
			filename: "index.js",
			path: path.resolve(__dirname, "public/login/dist/"),
		},
	},
	{
		name: "signup",
		entry: "./public/signup/src/index.js",
		mode: "production",
		output: {
			filename: "index.js",
			path: path.resolve(__dirname, "public/signup/dist/"),
		},
	},
];
