const getConfig = require("../services/getConfig.js");
const { MongoClient } = require("mongodb");
const argon2 = require("argon2");
const assert = require("assert");

//init config
const config = getConfig();

const dbClient = new MongoClient(config.dbURL);

class User {
	constructor(username, password) {
		this.email;
		this.username = username;
		this.password = password;
		this.alreadyExists = false;
		this.isAuthenticated = false;
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
					argon2.verify(queriedUser.password, this.password).then((verified) => {
						if (verified) {
							this.isAuthenticated = true;
						}
						resolve(this);
					});
				});
			});
		});
	}

	/**
	 * Saves user to DB. If user exists, this.alreadyExists = true then reject promise
	 * @returns {Promise<User>}
	 */
	save() {
		return new Promise((resolve, reject) => {
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
							// if user does not exist, create new DB entry and authenticate new user
							argon2
								.hash(this.password, {
									type: argon2.argon2id,
									memoryCost: 2 ** 16,
								})
								.then((hashedPassword) => {
									this.password = hashedPassword;
									users.insertOne(this).then(() => {
										this.isAuthenticated = true;
										resolve(this);
									});
								});
						} else {
							//else, attempt authentication, then reject and return 'this'
							this.authenticate().then(reject(this));
						}
					});
			});
		});
	}
}

module.exports = User;
