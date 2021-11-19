const { MongoClient } = require("mongodb");
const getConfig = require("../services/getConfig.js");
const assert = require("assert");

//init config
const config = getConfig();

//db init
const dbClient = new MongoClient(config.dbURL);
dbClient.connect((err) => {
	assert.equal(null, err); //die if bad
	console.log("Successfully connected to DB");

	const db = dbClient.db("fileserver");
	const Users = db.collection("users", { strict: true });
	Users.createIndex("username").then(() => dbClient.close());
});
