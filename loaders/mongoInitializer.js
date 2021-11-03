const { MongoClient } = require("mongodb");
const config = require("../config/config.json");
const assert = require("assert");

//db init
const dbClient = new MongoClient(config.dbURL);
dbClient.connect((err) => {
	assert.equal(null, err); //die if bad
	console.log("Successfully connected to DB");

	const db = dbClient.db("fileserver");
	const Users = db.collection("users", { strict: true });
	Users.createIndex("username").then(() => dbClient.close());
});
