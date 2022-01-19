const { MongoClient } = require("mongodb");
const config = require("../services/config");
const assert = require("assert");

//db init
const dbClient = new MongoClient(config.dbURL);

dbClient.connect((err) => {
	assert.equal(null, err); //die if bad
	console.log("Successfully connected to DB");
});
