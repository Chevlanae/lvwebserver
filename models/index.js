const userModel = require("./user.js");
const whitelistModel = require("./whitelist.js");

require("../loaders/mongoInitializer");

module.exports = {
	user: userModel,
	whitelist: whitelistModel,
};
