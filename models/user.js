const config = require("../services/config");
const { MongoClient } = require("mongodb");
const argon2 = require("argon2");
const { genToken } = require("../utils");

const dbClient = new MongoClient(config.dbURL);

class User {
	constructor() {
		this.isAuthenticated = false;
		this.invalidUsername = false;
		this.invalidPassword = false;
		this.alreadyExists = false;
		this.document = {}; //selection document
	}

	//DB document ID
	get id() {
		return this.document._id;
	}

	get username() {
		return this.document.username;
	}

	set username(newUsername) {
		this.update({ username: newUsername }, { _id: this.id });
	}

	get password() {
		return this.document.password;
	}

	set password(newPassword) {
		argon2
			.hash(newPassword, {
				type: argon2.argon2id,
				memoryCost: 2 ** 16,
			})
			.then((hashedPassword) => this.update({ password: hashedPassword }, { _id: this.id }));
	}

	get email() {
		return this.document.email;
	}

	set email(newEmail) {
		this.update({ email: newEmail }, { _id: this.id });
	}

	get verified() {
		return this.document.verified;
	}

	set verified(bool) {
		this.update({ verified: bool }, { _id: this.id });
	}

	/**
	 * Queries DB with a given filter and sets this.document to the queried result
	 * @param {Filter} filter Search filter
	 * @returns {Promise<Document>} Queried Document
	 */
	async fetch(filter, opts = { multiple: false, setter: true }) {
		await dbClient.connect();

		var users = dbClient.db(config.dbName).collection("users");

		const query = await users.find(filter).toArray();

		const result =
			query.length === 1
				? query[0]
				: query.length > 1
				? opts.multiple
					? query
					: query.sort((a, b) => a._id.getTimestamp() - b._id.getTimestamp())[0] //sorts array oldest entry to newest, then returns the oldest entry
				: null;

		return opts.setter ? (this.document = result) : result;
	}

	/**
	 * Saves user to DB, then sets this.document to zhe new DB entry, sets this.alreadyExists = true if there is an existing user with the same username
	 * @param {{username: string, password: string}} userDoc User's object, must have "username", and "password" properties
	 */
	async create(userDoc) {
		await dbClient.connect();

		var users = dbClient.db(config.dbName).collection("users");

		//fetch any existing user
		const existingUser = await this.fetch({ username: userDoc.username }, { multiple: true, setter: false });

		//insert newUser into db, if existing user does not exist.
		existingUser !== null
			? (this.alreadyExists = true)
			: await users.insertOne({
					...userDoc,
					password: await argon2.hash(userDoc.password, {
						type: argon2.argon2id,
						memoryCost: 2 ** 16,
					}),
					verification: {
						verified: false,
						token: genToken(32),
						tokenTimestamp: new Date().valueOf(),
					},
			  });

		await this.fetch({ username: userDoc.username });
	}

	/**
	 * Deletes currently selected user, or a user matching the specified filter. Then sets this.document to an empty object
	 * @param {Filter} filter Optional search filter
	 */
	async delete(filter = { _id: this.id }) {
		await dbClient.connect();

		var deletedUsers = dbClient.db(config.dbName).collection("deletedUsers");

		const deletedUser = await this.fetch(filter, { setter: false });

		deletedUsers.insertOne(deletedUser);

		var users = dbClient.db(config.dbName).collection("users");

		await users.deleteOne(filter);

		this.document = this.id.equals(deletedUser._id) ? {} : this.document;
	}

	/**
	 * Updates a user with given data and requeries the DB, defaults to the current selected user if no filter is defined
	 * @param {Object} data Object with desired upsert properties
	 * @param {Filter} filter Optional search filter
	 */
	async update(data, filter = { _id: this.id }) {
		await dbClient.connect();

		var users = dbClient.db(config.dbName).collection("users");

		await users.updateOne(filter, {
			$set: data,
		});

		await this.fetch(filter);
	}

	/**
	 * Checks credentials against stored credentials, defaults to the selected user if no filter is defined
	 * @param {string} password Plaintext password
	 * @param {Filter} filter Optional search filter
	 */
	async authenticate(password, filter = { _id: this.id }) {
		//query username
		await this.fetch(filter);

		//if query did not return null
		this.document !== null
			? //then verify hash
			  (await argon2.verify(this.password, password))
				? //verification success
				  (this.isAuthenticated = true)
				: //verification failed
				  (this.invalidPassword = true)
			: //else
			  (this.invalidUsername = true);
	}
}

module.exports = User;
