const config = require("../config/config.json");
const { MongoClient } = require("mongodb");
const argon2 = require("argon2");
const assert = require("assert");

const dbClient = new MongoClient(config.dbURL);

function hashPassword(password) {
	argon2.hash(password, {
		type: argon2.argon2id,
		memoryCost: 2 ** 16,
	});
}

class UserModel {
	constructor(username, password) {
		var hashedPassword = hashPassword(password).then(() => {
			this.username = username;
			this.password = hashedPassword;
			this.alreadyExists = false;
			this.isAuthenticated = false;
		});
	}

	/**
	 * Checks credentials against stored credentials, if they match, set isAuthenticated to true
	 */
	authenticate() {
		dbClient.connect((err) => {
			assert.equal(null, err); //die if bad

			var users = dbClient.db("fileserver").collection("users");
			users.findOne({ username: this.username }).then((user) => {
				if (this.password == user.password) {
					this.isAuthenticated = true;
				}
			});
		});
	}

	/**
	 * Saves user to DB. If user exists, set alreadyExists to true.
	 */
	save() {
		dbClient.connect((err) => {
			assert.equal(null, err); //die if bad

			var users = dbClient.db("fileserver").collection("users");
			users
				.find({ username: this.username })
				.forEach(() => {
					this.alreadyExists = true;
				})
				.then(() => {
					if (!this.alreadyExists) {
						users.insertOne(this);
					}
				});
		});
	}
}

module.exports = UserModel;
