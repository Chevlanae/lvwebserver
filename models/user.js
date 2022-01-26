const config = require("../services/config");
const { MongoClient, Filter } = require("mongodb");
const argon2 = require("argon2");
const secureRandom = require("secure-random");

class User {
	#dbClient;

	constructor() {
		//flags
		this.isAuthenticated = false;
		this.invalidUsername = false;
		this.invalidPassword = false;
		this.alreadyExists = false;

		//db connection
		this.#dbClient = new MongoClient(config.dbURL);
		this.#dbClient.connect();
	}

	//MongoDB Document ID
	get id() {
		return this.document?._id;
	}

	//Return currently selected user's username. If no user is selected, return undefined.
	get username() {
		return this.document?.username;
	}

	//Update selected user's username with a given string, if there is one selected.
	set username(newUsername) {
		this.id && this.update({ username: newUsername });
	}

	//Return currently selected user's password hash. If no user is selected, return undefined.
	get password() {
		return this.document?.password;
	}

	//Update selected user's password with a given string, if there is one selected.
	set password(newPassword) {
		this.id &&
			argon2
				.hash(newPassword, {
					type: argon2.argon2id,
					memoryCost: 2 ** 16,
				})
				.then((hashedPassword) => this.update({ password: hashedPassword }));
	}

	//Return currently selected user's email string. If no user is selected, return undefined.
	get email() {
		return this.document?.email;
	}

	//Update selected user's email with a given string, if there is one selected.
	set email(newEmail) {
		this.id && this.update({ email: newEmail });
	}

	//Return selected user's permissions object, if there is one selected.
	get permissions() {
		return this.document?.permissions;
	}

	//Updates selected user's permissions Object, if there is one selected.
	set permissions(doc) {
		this.id && this.update(doc);
	}

	//Return selected user's verification object, if there is one selected.
	get verification() {
		return this.document?.verification;
	}

	/**
	 * Queries DB with a given filter and sets this.document to the queried result
	 * @param {Filter} filter Search filter
	 * @param {{ multiple: boolean, setter: boolean }} opts Function options
	 * @returns {Promise<Document>} Queried Document
	 */
	async fetch(filter = { _id: this.id }, opts = { multiple: false, setter: true }) {
		//users collection
		var users = this.#dbClient.db(config.dbName).collection("users");

		//query operation
		const query = await users
			.find(filter)
			.toArray() //convert WithId to Array
			.sort((a, b) => a._id.getTimestamp() - b._id.getTimestamp())[0]; //if there are multiple entries, they are sorted oldest entry to newest

		//big ol ternary chain
		const result =
			query.length === 1 //check if one result
				? query[0] //if true, return result
				: query.length > 1 //if false, check if there are multiple results
				? opts.multiple //check if the "multiple" option is set
					? query //if true, return whole query
					: query[0] //if false, return the oldest entry
				: null; //if query has no results, return null

		//return result, if "setter" option is set, set this.document to the result
		return opts.setter ? (opts.multiple ? (this.document = result[0]) : (this.document = result)) : result;
	}

	/**
	 * Saves user to DB with given userDoc (any Object, must have username and password properties), then sets this.document to the new DB entry, sets this.alreadyExists = true if there is an existing user with the same username
	 * @param {{username: string, password: string}} userDoc User's object, must have "username", and "password" properties
	 */
	async create(userDoc) {
		//init users collection
		var users = this.#dbClient.db(config.dbName).collection("users");

		//fetch any existing user using given username
		const existingUser = await this.fetch({ username: userDoc.username }, { multiple: true, setter: false });

		//insert newUser into db, if existing user does not exist.
		existingUser !== null
			? (this.alreadyExists = true) //if existing user exists
			: await users.insertOne({
					//copy any given data
					...userDoc,
					//hash given password
					password: await argon2.hash(userDoc.password, {
						type: argon2.argon2id,
						memoryCost: 2 ** 16,
					}),
					//set permissions array
					permissions: {
						user: true,
						superUser: false,
						admin: false,
					},
					//set verification object
					verification: {
						verified: false,
						token: secureRandom.randomBuffer(256),
					},
			  });

		//update this.document with inserted user
		await this.fetch({ username: userDoc.username });
	}

	/**
	 * Deletes currently selected user, or a user matching the specified filter. Then sets this.document to undefined
	 * @param {Filter} filter Optional search filter
	 */
	async delete(filter = { _id: this.id }) {
		//init deletedUsers collections
		var deletedUsers = this.#dbClient.db(config.dbName).collection("deletedUsers");

		//query user a final time
		const deletedUser = await this.fetch(filter, { setter: false });

		//copy user to be deleted into the deletedUsers collection.
		deletedUsers.insertOne(deletedUser);

		//init users collection
		var users = this.#dbClient.db(config.dbName).collection("users");

		//delete user entry
		await users.deleteOne(filter);

		//set document to undefined, unless this weird check fails. I can remember why that check is there but I'm too afraid to remove it.
		this.document = this.id.equals(deletedUser._id) ? undefined : this.document;
	}

	/**
	 * Updates a user with given data (any Object) and refreshes this.document, defaults to the current selected user if no filter is defined
	 * @param {Object} data Object with desired upsert properties
	 * @param {Filter} filter Optional search filter
	 */
	async update(data, filter = { _id: this.id }) {
		//init users collection
		var users = this.#dbClient.db(config.dbName).collection("users");

		//upsert given data with the given filter
		await users.updateOne(filter, {
			$set: data,
		});

		//fetch updated user entry
		await this.fetch(filter);
	}

	/**
	 * Checks password against stored password, defaults to the selected user if no filter is defined
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

	/**
	 * Takes a given token and checks it against the user's verification token
	 * @param {string} tokenString Base64url encoded buffer string
	 * @param {mongodb.Filter} filter Optional search filter
	 */
	async verify(tokenString, filter) {
		//convert token from base64url to a buffer
		var token = Buffer.from(tokenString, "base64url");

		//copy verification object
		var verification = this.verification;

		//check if verification token equals given token, then update the verification object
		if (token.equals(verification.token)) {
			verification.verified = true;
			await this.update({ verification: verification });
		}
	}

	/**
	 * Closes the DB connection created by the constructor
	 */
	async closeConnection() {
		await this.#dbClient.close();
	}
}

module.exports = User;
