const config = require("../services/getConfig.js");
const { MongoClient } = require("mongodb");
const argon2 = require("argon2");
const assert = require("assert");

const dbClient = new MongoClient(config.dbURL);

class User {
	constructor(username, password, email = "") {
		this.email = email;
		this.username = username;
		this.password = password;
		this.isAuthenticated = false;
	}

	/**
	 * Checks credentials against stored credentials, if they match, this.isAuthenticated = true
	 * @returns {Promise<void>}
	 */
	authenticate() {
		return new Promise((resolve, reject) => {
			dbClient.connect((err) => {
				//throw assertion error if there is a DB connection error
				assert.equal(null, err);

				//init "user" collection
				var users = dbClient.db("lvwebserver").collection("users");

				//query username
				users.findOne({ username: this.username }).then((queriedUser) => {
					//init rejection result
					var result = { invalidUsername: false, invalidPassword: false };

					//if user exists in DB
					if (queriedUser != null) {
						//verify hash
						argon2.verify(queriedUser.password, this.password).then((verified) => {
							if (verified) {
								this.isAuthenticated = true;
								resolve(); //if verified, resolve
							} else {
								result.invalidPassword = true;
								reject(result); //else, reject and return "result"
							}
						});
					} else {
						result.invalidUsername = true;
						reject(result); //else, reject and return "result"
					}
				});
			});
		});
	}

	/**
	 * Saves user to DB. Rejects promise if user already exists in DB
	 * @returns {Promise<void>}
	 */
	save() {
		return new Promise((resolve, reject) => {
			dbClient.connect((err) => {
				//throw assertion error if there is a DB connection error
				assert.equal(null, err);

				//init "user" collection
				var users = dbClient.db("lvwebserver").collection("users");

				//query username
				users
					.find({ username: this.username })
					.forEach(() => {
						reject(); //if there are ANY existing entries, reject promise
					})
					.then(() => {
						//hash given password, then insert new DB entry
						argon2
							.hash(this.password, {
								//hash password
								type: argon2.argon2id,
								memoryCost: 2 ** 16,
							})
							.then((hashedPassword) => {
								//insert new user into db
								var newUser = {
									email: this.email,
									username: this.username,
									password: hashedPassword,
								};
								users.insertOne(newUser).then(() => {
									resolve();
								});
							});
					});
			});
		});
	}
}

module.exports = User;
