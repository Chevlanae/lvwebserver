const config = require("../services/config");
const { MongoClient } = require("mongodb");
const assert = require("assert");
const MUUID = require("uuid-mongodb");

const dbClient = new MongoClient(config.dbURL);

class whitelist {
	/**
	 * @param {string} list Must be either "user", or "admin". Otherwise it will throw an exception
	 */
	constructor(list) {
		var lists = ["user", "admin"];

		for (var l of lists) {
			if (list === l) {
				this.listID = this.list + "WhitelistID";
			}
		}

		if (!this.listID) {
			lists.map((value) => {
				return `"${value}"`;
			});

			throw new Error(`Parameter "list" can only hold these values: ${lists.join(", ")}`);
		}

		this.onList = false;
	}

	/**
	 * finds user with given filter, and then checks if they are on the whitelist, resolves with whitelist document
	 * @param {Object} filter MongoDB search params
	 * @returns {WithID<Document>} MongoDB Document
	 */
	check(filter) {
		return new Promise((resolve, reject) => {
			dbClient.connect((err) => {
				assert.equal(null, err);

				var whitelist = dbClient.db("lvwebserver").collection(this.list);

				var users = dbClient.db("lvwebserver").collection("users");
				var rejectReason = { notOnList: false, IDDoesNotMatch: false, userDoesNotExist: false };

				users.findOne(filter).then((user) => {
					if (user) {
						whitelist.findOne({ _id: user[this.listID] }).then((document) => {
							if (document) {
								if (user._id.equals(document.userID)) {
									this.onList = true;
									resolve(document);
								} else {
									rejectReason.IDDoesNotMatch = true;
									reject(rejectReason);
								}
							} else {
								rejectReason.notOnList = true;
								reject(rejectReason);
							}
						});
					} else {
						rejectReason.userDoesNotExist = true;
						reject(rejectReason);
					}
				});
			});
		});
	}

	/**
	 * finds user with given filter, then adds them to the whitelist
	 * @param {Object} filter MongoDB search params
	 * @returns {WithID<Document>} MongoDB Document
	 */
	add(filter) {
		return new Promise((resolve, reject) => {
			dbClient.connect((err) => {
				assert.equal(null, err);

				var whitelist = dbClient.db("lvwebserver").collection(this.list);

				var users = dbClient.db("lvwebserver").collection("users");

				var rejectReason = { userDoesNotExist: false, insertFailed: false, upsertFailed: false };

				users.findOne(filter).then((user) => {
					if (user) {
						const uuid = MUUID.v4();
						var updateDoc = {
							$set: {},
						};

						updateDoc.$set[this.listID] = uuid;

						users.updateOne({ username: user.username }, updateDoc).then((result) => {
							if (result.acknowledged) {
								whitelist
									.insertOne({
										_id: uuid,
										userID: user._id,
									})
									.then((result) => {
										if (result.acknowledged) {
											this.onList = true;
											resolve(result);
										} else {
											rejectReason.insertFailed = true;
											reject(rejectReason);
										}
									});
							} else {
								rejectReason.upsertFailed = true;
								reject(rejectReason);
							}
						});
					} else {
						rejectReason.userDoesNotExist = true;
						reject(rejectReason);
					}
				});
			});
		});
	}

	/**
	 * finds user with given filter, then removes them from the whitelist
	 * @param {Object} filter MongoDB search params
	 * @returns {DeleteResult} MongoDB Document
	 */
	remove(filter) {
		return new Promise((resolve, reject) => {
			dbClient.connect((err) => {
				assert.equal(null, err);

				var whitelist = dbClient.db("lvwebserver").collection(this.list);

				var users = dbClient.db("lvwebserver").collection("users");

				var rejectReason = { userDoesNotExist: false, deleteFailed: false };

				users.findOne(filter).then((user) => {
					if (user) {
						whitelist.deleteOne({ _id: user[this.listID] }).then((result) => {
							if (result.acknowledged) {
								this.onList = false;
								resolve(result);
							} else {
								rejectReason.deleteFailed = true;
								reject(rejectReason);
							}
						});
					} else {
						rejectReason.userDoesNotExist = true;
						reject(rejectReason);
					}
				});
			});
		});
	}
}

module.exports = whitelist;
