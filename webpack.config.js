const path = require("path");

module.exports = {
	entry: {
		login: "./views/auth/login/src/index.js",
		signup: "./views/auth/signup/src/index.js",
		confirm: "./views/auth/confirm/src/index.js",
	},
	output: {
		filename: "[name].js",
		path: path.resolve(__dirname, "public/scripts/"),
	},
	mode: "production",
};
