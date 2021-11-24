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
		this.alreadyExists = false;
		this.isAuthenticated = false;
		this.invalidUsername = false;
		this.invalidPassword = false;
	}

	/**
	 * Checks credentials against stored credentials, if they match, this.isAuthenticated = true
	 * @returns {Promise<void>}
	 */
	authenticate() {
		return new Promise((resolve) => {
			dbClient.connect((err) => {
				assert.equal(null, err); //die if bad

				var users = dbClient.db("lvwebserver").collection("users");
				users.findOne({ username: this.username }).then((queriedUser) => {
					if (queriedUser != null) {
						argon2.verify(queriedUser.password, this.password).then((verified) => {
							if (verified) {
								this.isAuthenticated = true;
								resolve();
							} else {
								this.invalidPassword = true;
								resolve();
							}
						});
					} else {
						this.invalidUsername = true;
						resolve();
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
				assert.equal(null, err); //die if bad

				var users = dbClient.db("lvwebserver").collection("users");
				users
					.find({ username: this.username })
					.forEach(() => {
						this.alreadyExists = true; // if there are ANY existing entries, this.alreadyExists is set to true
					})
					.then(() => {
						if (!this.alreadyExists) {
							// if user does not already exist, create new DB entry and authenticate new user
							argon2
								.hash(this.password, {
									//hash password
									type: argon2.argon2id,
									memoryCost: 2 ** 16,
								})
								.then((hashedPassword) => {
									//insert new user into db, then authenticate
									var newUser = {
										email: this.email,
										username: this.username,
										password: hashedPassword,
									};

									users.insertOne(newUser).then(() => {
										resolve();
									});
								});
						} else {
							reject();
						}
					});
			});
		});
	}
}

module.exports = User;
