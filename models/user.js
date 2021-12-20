const config = require("../services/getConfig.js");
const { MongoClient } = require("mongodb");
const argon2 = require("argon2");
const assert = require("assert");

const dbClient = new MongoClient(config.dbURL);

class User {
	/**
	 * Checks credentials against stored credentials, resolves queried document if authenticated, else rejects with a result object
	 * @param {string} username Escaped username
	 * @param {string} password Plaintext password
	 */
	authenticate(username, password) {
		return new Promise((resolve, reject) => {
			dbClient.connect((err) => {
				//throw assertion error if there is a DB connection error
				assert.equal(null, err);

				//init "user" collection
				var users = dbClient.db("lvwebserver").collection("users");

				//query username
				users.findOne({ username: username }).then((queriedUser) => {
					//init rejection result
					var rejectResult = { invalidUsername: false, invalidPassword: false };

					//if user exists in DB
					if (queriedUser != null) {
						//verify hash
						argon2.verify(queriedUser.password, password).then((verified) => {
							if (verified) {
								resolve(queriedUser); //if verified, resolve
							} else {
								rejectResult.invalidPassword = true;
								reject(rejectResult); //else, reject and return "result"
							}
						});
					} else {
						rejectResult.invalidUsername = true;
						reject(rejectResult); //else, reject and return "result"
					}
				});
			});
		});
	}

	/**
	 * Saves user to DB. Rejects if user already exists in DB. Resolves with inserted document
	 * @returns {Promise<import("mongodb").Document>}
	 */
	save(email, username, password) {
		return new Promise((resolve, reject) => {
			dbClient.connect((err) => {
				//throw assertion error if there is a DB connection error
				assert.equal(null, err);

				//init "user" collection
				var users = dbClient.db("lvwebserver").collection("users");

				//query username
				users
					.find({ username: username })
					.forEach(() => {
						reject(); //if there are ANY existing entries, reject promise
					})
					.then(() => {
						//hash given password, then insert new DB entry
						argon2
							.hash(password, {
								//hash password
								type: argon2.argon2id,
								memoryCost: 2 ** 16,
							})
							.then((hashedPassword) => {
								//insert new user into db
								var newUser = {
									email: email,
									username: username,
									password: hashedPassword,
									account: { type: "user" },
								};
								users.insertOne(newUser).then((doc) => {
									resolve(doc);
								});
							});
					});
			});
		});
	}

	/**
	 * Queries DB and returns result
	 * @param {string} username Escaped username
	 * @returns {Document} Queried user
	 */
	get(username) {
		return new Promise((resolve, reject) => {
			dbClient.connect((err) => {
				assert.equal(null, err);

				var users = dbClient.db("lvwebserver").collection("users");

				var arr = [];
				users
					.find({ username: username })
					.forEach((document) => {
						arr.push(document);
					})
					.then(() => {
						if (arr.length != 0) {
							if (arr.length === 1) {
								resolve(arr[0]);
							} else {
								resolve(arr);
							}
						} else {
							reject();
						}
					});
			});
		});
	}
}

module.exports = User;
