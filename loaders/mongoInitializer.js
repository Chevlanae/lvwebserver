const { MongoClient } = require("mongodb");
const config = require("../services/config");
const assert = require("assert");

//db init
const dbClient = new MongoClient(config.dbURL);

dbClient.connect((err) => {
	assert.equal(null, err); //die if bad
	console.log("Successfully connected to DB");

	const db = dbClient.db("lvwebserver");

	const Users = db.collection("users", { strict: true });
	const pendingUsers = db.collection("pendingUsers", { strict: true });
	const duplicateUsers = db.collection("duplicateUsers", { strict: true });
	Users.createIndex("username");
	pendingUsers.createIndex("username");
	duplicateUsers.createIndex("username");

	db.collection("userWhitelist", { strict: true });
	db.collection("adminWhitelist", { strict: true });
});
