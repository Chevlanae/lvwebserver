const config = require("../services/config");
const { MongoClient } = require("mongodb");
const MUUID = require("uuid-mongodb");
const User = require("./user");

const dbClient = new MongoClient(config.dbURL);

class List {
	#user;
	constructor(name) {
		this.list = name + "Permissions";
		this.listIDKey = name + "PermissionsID";
		this.#user = new User();
	}

	/**
	 * Finds user with a given filter, returns true if they are on the permissions list, false if not. Returns null if user does not exist
	 */
	async check(filter) {
		if (await this.#user.fetch(filter)) {
			await dbClient.connect();
			var list = dbClient.db(config.dbName).collection(this.list);

			var entry = await list.findOne({ _id: this.#user.document[this.listIDKey] });

			return entry !== null ? this.#user.id.equals(entry.userID) : false;
		} else {
			return null;
		}
	}

	/**
	 * Finds user with given filter, then adds them to the list. Returns true for operation success, false if it failed. Returns null if user does not exist.
	 */
	async add(filter) {
		if (await this.#user.fetch(filter)) {
			await dbClient.connect();
			var list = dbClient.db(config.dbName).collection(this.list);

			let permissionsID = MUUID.v4();
			let updateDoc = {
				[this.listIDKey]: permissionsID,
			};

			await this.#user.update(updateDoc);

			return await list.insertOne({ _id: permissionsID, userID: this.#user.id }).acknowledged;
		} else {
			return null;
		}
	}

	/**
	 * Finds user with given filter, then removes them from the permissions list. Returns true for operation success, false if it failed. Returns null if user does not exist.
	 */
	async remove(filter) {
		if (await this.#user.fetch(filter)) {
			await dbClient.connect();
			var list = dbClient.db(config.dbName).collection(this.list);

			return (await list.deleteOne({ _id: this.#user.document[this.listIDKey] })).acknowledged;
		} else {
			return null;
		}
	}
}

module.exports = List;
