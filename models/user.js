const config = require("../services/config");
const { MongoClient } = require("mongodb");
const argon2 = require("argon2");
const assert = require("assert");

const dbClient = new MongoClient(config.dbURL);

class User {
	constructor(username, password) {
		//auth params
		this.auth = {
			isAuthenticated: false,
			invalidUsername: false,
			invalidPassword: false,
		};

		//copy of mongoDB entry
		this._document = null;

		//DB operation params, for use within the local scope
		this.initComplete = false;
		this.inOperation = true;

		//authenticate user
		this.authenticate(username, password)
			.then((resolvedUser) => {
				//authenticated
				this.auth.isAuthenticated = true;
				this._document = resolvedUser;
			})
			.catch((reason) => {
				//authentication failed
				this.auth = { ...this.auth, ...reason };
			})
			.finally(() => {
				//set operation params
				this.initComplete = true;
				this.inOperation = false;
			});
	}

	get username() {
		return this._document.username;
	}

	get password() {
		return this._document.password;
	}

	get email() {
		return this._document.email;
	}

	get whitelists() {
		var arr = [];
		Object.keys(this).forEach((value) => {
			if ("whitelistID" in value) {
				//return string preceding "whitelistID"
				arr.push(value.slice(0, value.indexOf("whitelistID")));
			}
		});
		return arr;
	}

	get document() {
		//if _document exists, return
		if (this._document != null) {
			return this._document;
		} else {
			try {
				//try to fetch user from DB
				this.inOperation = true;
				this._document = this.fetch(this.username).finally(() => (this.inOperation = false));
			} catch {
				//else null
				this._document = null;
			} finally {
				return this._document;
			}
		}
	}

	set document(data) {
		//if data is not an object, throw Error()
		try {
			var obj = { ...data };
		} catch {
			throw new Error(`Parameter "data" must be an object.`);
		}

		//upsert given obj
		this.inOperation = true;
		this._document = { ...this._document, ...obj };
		this.update(this.username, this._document).finally(() => (this.inOperation = false));
	}

	/**
	 * Checks credentials against stored credentials, resolves queried document if authentication successful, else rejects with a result object
	 * @param {string} username Escaped username
	 * @param {string} password Plaintext password
	 * @returns {Promise<Document>} Authenticated user's DB entry
	 */
	async authenticate(username, password) {
		this.inOperation = true;
		return new Promise((resolve, reject) => {
			dbClient.connect((err) => {
				//throw assertion error if there is a DB connection error
				assert.equal(null, err);

				//init "user" collection
				var users = dbClient.db("lvwebserver").collection("users");

				//init rejection result
				var rejectReason = { invalidUsername: false, invalidPassword: false };

				//query username
				users
					.findOne({ username: username })
					.then((queriedUser) => {
						//if user exists in DB
						if (queriedUser != null) {
							//verify hash
							argon2.verify(queriedUser.password, password).then((verified) => {
								if (verified) {
									resolve(queriedUser); //if verified, resolve
								} else {
									rejectReason.invalidPassword = true;
									reject(rejectReason); //else, reject and return "result"
								}
							});
						} else {
							rejectReason.invalidUsername = true;
							reject(rejectReason); //else, reject and return "result"
						}
					})
					.finally(() => (this.inOperation = false));
			});
		});
	}

	/**
	 * Saves user to DB, then resolves with inserted document. Rejects if user already exists in DB.
	 * @param {string} email User's email address
	 * @param {string} username User's username
	 * @param {string} password User's password
	 * @returns {Promise<Document>} Insertion result
	 */
	async create(email, username, password) {
		this.inOperation = true;
		return new Promise((resolve, reject) => {
			dbClient.connect((err) => {
				//throw assertion error if there is a DB connection error
				assert.equal(null, err);

				//init "user" collection
				var users = dbClient.db("lvwebserver").collection("pendingUsers");

				//query username
				users
					.find({ username: username })
					.forEach(() => {
						reject(new Error(`User "${username}" already exists.`)); //if there are ANY existing entries, reject promise
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
								};
								users.insertOne(newUser).then((result) => {
									this._document = this.fetch(username);
									resolve(result);
								});
							});
					})
					.finally(() => (this.inOperation = false));
			});
		});
	}

	/**
	 * Queries DB for a given username and returns queried document. Rejects promise if user does not exist in DB.
	 * @param {string} username Escaped username
	 * @returns {Promise<Document>} Queried Document
	 */
	async fetch(username) {
		return new Promise((resolve, reject) => {
			dbClient.connect((err) => {
				//throw assertion error if there is a DB connection error
				assert.equal(null, err);

				var users = dbClient.db("lvwebserver").collection("users");

				//document aggregator
				var arr = [];

				//start operation
				this.inOperation = true;
				users
					.find({ username: username })
					.forEach((document) => arr.push(document))
					.then(() => {
						if (arr.length === 1) {
							//if only one entry, resolve
							resolve(arr[0]);
						} else if (arr.length > 0) {
							//if there are multiple results, sort from oldest to newest
							arr.sort((a, b) => {
								return a._id.getTimestamp() - b._id.getTimestamp();
							});

							//then mark these entries as duplicates for review
							var duplicateUsers = dbClient.db("lvwebserver").collection("duplicateUsers");
							duplicateUsers.insertMany(arr);

							//resolve with oldest result
							resolve(arr[0]);
						} else {
							reject(new Error(`User "${username}" does not exist.`));
						}
					})
					.finally(() => (this.inOperation = false)); //end operation
			});
		});
	}

	/**
	 * Updates a user with given data. Returns the result of the upsert operation, rejects if upsert fails
	 * @param {string} username Escaped username
	 * @param {*} data Object with desired update parameters
	 * @returns {Promise<UpdateResult>}
	 */
	async update(username, data) {
		return new Promise((resolve, reject) => {
			dbClient.connect((err) => {
				assert.equal(null, err);

				var users = dbClient.db("lvwebserver").collection("users");

				//upsert format
				var updateDoc = {
					$set: data,
				};

				//start operation
				this.inOperation = true;
				users
					.updateOne({ username: username }, updateDoc)
					.then((result) => (result.acknowledged ? resolve(result) : reject(new Error(`Upsert failed for user "${username}"`))))
					.finally(() => (this.inOperation = false)); //end operation
			});
		});
	}
}

module.exports = User;
