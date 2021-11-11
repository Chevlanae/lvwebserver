const config = require("../config/config.json");
const { MongoClient } = require("mongodb");
const argon2 = require("argon2");
const assert = require("assert");

const dbClient = new MongoClient(config.dbURL);

class User {
	constructor() {
		this.username = null;
		this.password = null;
		this.alreadyExists = false;
		this.isAuthenticated = false;
	}

	/**
	 * Create's new object with user credentials, and attempts authentication.
	 * @returns {Promise<User>}
	 */
	init(username, password) {
		return new Promise((resolve) => {
			this.hashPassword(password).then((hash) => {
				this.username = username;
				this.password = hash;
				this.authenticate().then(resolve(this));
			});
		});
	}

	/**
	 * Hashes a given password with argon2id
	 * @param {string} password any string
	 * @returns {Promise<string>} A promise that resolves to the hashed password
	 */
	hashPassword(password) {
		return new Promise((resolve) => {
			argon2
				.hash(password, {
					type: argon2.argon2id,
					memoryCost: 2 ** 16,
				})
				.then((hash) => resolve(hash));
		});
	}
	/**
	 * Checks credentials against stored credentials, if they match, this.isAuthenticated = true
	 * @returns {Promise<void>}
	 */
	authenticate() {
		return new Promise((resolve) => {
			dbClient.connect((err) => {
				assert.equal(null, err); //die if bad

				var users = dbClient.db("fileserver").collection("users");
				users.findOne({ username: this.username }).then((queriedUser) => {
					if (this.password === queriedUser.password) {
						this.isAuthenticated = true;
					}
					resolve();
				});
			});
		});
	}

	/**
	 * Saves user to DB. If user exists, this.alreadyExists = true then reject promise
	 * @returns {Promise<User>}
	 */
	save() {
		return new Promise((resolve) => {
			dbClient.connect((err) => {
				assert.equal(null, err); //die if bad

				var users = dbClient.db("fileserver").collection("users");
				users
					.find({ username: this.username })
					.forEach(() => {
						this.alreadyExists = true; // if there are ANY matching entries, this.alreadyExists is set to true
					})
					.then(() => {
						if (!this.alreadyExists) {
							users // if user does not exist, create new DB entry and authenticate new user
								.insertOne(this)
								.then(() => {
									this.isAuthenticated = true;
									resolve(this);
								});
						} else {
							resolve(this);
						}
					});
			});
		});
	}
}

module.exports = User;
