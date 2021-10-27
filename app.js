const express = require("express");
const session = require("express-session");
const { body, matchedData } = require("express-validator");
const cors = require("cors");
const bodyParser = require("body-parser");
const favicon = require("serve-favicon");
const https = require("https");
const argon2 = require("argon2");
const { MongoClient } = require("mongodb");
const MongoStore = require("connect-mongo");
const assert = require("assert");
const fs = require("fs");
const Environment = require("./env.json");

//process args
var port;
process.argv.forEach((val, index) => {
	if (val == "--port") {
		try {
			port = new Number(argv[index + 1]);
		} catch (e) {
			console.error(e);
		}
	}
});
if (port == undefined) {
	port = 443;
}

//db init
const dbClient = new MongoClient(Environment.dbURL);
dbClient.connect((err) => {
	assert.equal(null, err);
	console.log("Successfully connected to DB");

	const db = dbClient.db("fileserver");
	const Users = db.collection("users", { strict: true });
	Users.createIndex("username").then(() => dbClient.close());
});

const hashPassword = async (password) =>
	argon2.hash(password, {
		type: argon2.argon2id,
		memoryCost: 2 ** 16,
	});

const secretArr = () => {
	////Shuffle array of session secrets
	let array = Environment.sessionSecrets;
	let currentIndex = array.length,
		randomIndex;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex],
			array[currentIndex],
		];
	}
	return array;
};

const resJSON = (message, error) => {};

//server init
var app = express();

app.use("/static", express.static("./static"));
app.use(bodyParser.json({ limit: "50mb" }));
app.use(favicon(__dirname + "/static/images/favicon.ico"));
app.use(
	session({
		cookie: { secure: true, httpOnly: true, samesite: true, maxAge: 600000 },
		resave: false,
		saveUninitialized: true,
		name: "server.sid",
		secret: secretArr(),
		store: MongoStore.create({
			mongoUrl: Environment.dbURL,
			crypto: {
				secret: Environment.storeSecret,
			},
		}),
	}),
);

//configure cors
var corsOptionsDelegate = function (req, callback) {
	var corsOptions;
	if (serverVar.originAllowList.indexOf(req.header("Origin")) !== -1) {
		corsOptions = { origin: true }; // reflect (enable) the requested origin in the CORS response
	} else {
		corsOptions = { origin: false }; // disable CORS for this request
	}
	callback(null, corsOptions); // callback expects two parameters: error and options
};

//authorization check
function checkSignIn(req, res, next) {
	if (req.session.user) {
		next(); //If session exists, proceed to page
	} else {
		res.redirect("/login");
	}
}

app.get("/", checkSignIn, cors(corsOptionsDelegate), function (req, res) {
	res.sendFile("/html/index.html", { root: __dirname });
});

app.get("/signup", function (req, res) {
	res.sendFile("/html/signup/index.html", { root: __dirname });
});

app.post(
	"/signup",
	body("email").isString().isEmail().normalizeEmail(),
	body("username").isString().escape(),
	body("password").isString(),
	function (req, res) {
		var userData = matchedData(req, { locations: ["body"] });

		if (
			!("email" in userData && "username" in userData && "password" in userData)
		) {
			res.status(400).send();
		}

		dbClient.connect((err) => {
			assert.equal(null, err);

			var users = dbClient.db("fileserver").collection("users");
			var userExists = false;
			users
				.find({ username: userData.username })
				.forEach(() => {
					userExists = true;
				})
				.then(() => {
					if (!userExists) {
						hashPassword(userData.password).then((hashedPassword) => {
							userData.password = hashedPassword;

							users.insertOne(userData);

							req.session.user = unescape(userData.username);
							res.sendFile("./html/signup/confirm_email.html", {
								root: __dirname,
							});
						});
					} else {
						res.status(400).send("User already exists");
					}
				});
		});
	},
);

app.get("/login", function (req, res) {
	res.sendFile("/html/login/index.html", { root: __dirname });
});

app.post(
	"/login",
	body("username").isString().escape(),
	body("password").isString(),
	function (req, res) {
		var userData = matchedData(req, { locations: ["body"] });

		dbClient.connect((err) => {
			assert.equal(null, err);

			var users = dbClient.db("fileserver").collection("users");
			users.findOne({ username: userData.username }).then((user) => {
				if (user == null) {
					res.status(400).send("Invalid Username");
					return;
				}

				hashPassword(userData.password).then((hashedPassword) => {
					console.log(hashedPassword, user.password);
					if (hashedPassword === user.password) {
						req.session.user = userData.username;
						res.redirect("/");
					} else {
						res.status(400).send("Invalid Password");
					}
					dbClient.close();
				});
			});
		});
	},
);

//https config
var options = {
	key: fs.readFileSync(Environment.SSL.key),
	cert: fs.readFileSync(Environment.SSL.cert),
};

var server = https.createServer(options, app);

server.listen(port, () => {
	console.log("Server started on port: " + port.toString());
});
