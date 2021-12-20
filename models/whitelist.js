const config = require("../services/getConfig.js");
const { MongoClient } = require("mongodb");
const assert = require("assert");
const MUUID = require("uuid-mongodb");

const dbClient = new MongoClient(config.dbURL);

class whitelist {
	constructor(list) {
		if (list === "user") {
			this.list = "userWhitelist";
		} else if (list === "admin") {
			this.list = "adminWhitelist";
		} else {
			throw new Error("Parameter 'list' must either be 'user', or 'admin.");
		}
	}

	check(username) {
		return new Promise((resolve, reject) => {
			dbClient.connect((err) => {
				assert.equal(null, err);

				var whitelist = dbClient.db("lvwebserver").collection(this.list);

				var users = dbClient.db("lvwebserver").collection("users");

				var rejectResult = { notOnList: false };

				users.findOne({ username: username }).then((user) => {
					if (user !== null) {
						whitelist.findOne({ _id: user[this.list + "ID"] }).then((document) => {
							if (document !== null) {
								if (user._id.equals(document.userID)) {
									resolve(user);
								} else {
									reject(rejectResult);
								}
							} else {
								rejectResult.notOnList = true;
								reject(rejectResult);
							}
						});
					} else {
						reject(rejectResult);
					}
				});
			});
		});
	}

	add(username) {
		return new Promise((resolve, reject) => {
			dbClient.connect((err) => {
				assert.equal(null, err);

				var whitelist = dbClient.db("lvwebserver").collection(this.list);

				var users = dbClient.db("lvwebserver").collection("users");

				var rejectResult = { userDoesNotExist: false, insertFailed: false };

				users.findOne({ username: username }).then((user) => {
					if (user !== null) {
						const uuid = MUUID.v4();
						var updateDoc = {
							$set: {},
						};

						updateDoc.$set[this.list + "ID"] = uuid;

						users.updateOne({ username: user.username }, updateDoc).then((result) => {
							if (result.acknowledged) {
								whitelist
									.insertOne({
										_id: uuid,
										userID: user._id,
									})
									.then((result) => {
										if (result.acknowledged) {
											resolve(true);
										} else {
											rejectResult.insertFailed = true;
											reject(rejectResult);
										}
									});
							} else {
								rejectResult.insertFailed = true;
								reject(rejectResult);
							}
						});
					} else {
						rejectResult.userDoesNotExist = true;
						reject(rejectResult);
					}
				});
			});
		});
	}

	remove(username) {
		return new Promise((resolve, reject) => {
			dbClient.connect((err) => {
				assert.equal(null, err);

				var whitelist = dbClient.db("lvwebserver").collection(this.list);

				var users = dbClient.db("lvwebserver").collection("users");

				var rejectResult = { userDoesNotExist: false, deleteFailed: false };

				users.findOne({ username: username }).then((user) => {
					if (user !== null) {
						whitelist.deleteOne({ _id: user.whitelistID }).then((result) => {
							if (result.acknowledged) {
								resolve(true);
							} else {
								rejectResult.deleteFailed = true;
								reject(rejectResult);
							}
						});
					} else {
						rejectResult.userDoesNotExist = true;
						reject(rejectResult);
					}
				});
			});
		});
	}
}

module.exports = whitelist;
