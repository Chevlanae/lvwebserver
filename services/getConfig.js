const fs = require("fs");

/**
 * Generates a token given the desired length
 * @param {number}length desired token length
 * @returns {string}
 */
function generateToken(length) {
	//edit the token allowed characters
	var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
	var b = [];
	for (var i = 0; i < length; i++) {
		var j = (Math.random() * (a.length - 1)).toFixed(0);
		b[i] = a[j];
	}
	return b.join("");
}

/**
 *shuffles elements of an array, outputs new array with shuffled elements
 * @param {Array} array any array
 * @returns {Array} shuffled array
 */
function shuffleArray(array) {
	////Shuffle array of session secrets
	let currentIndex = array.length,
		randomIndex;

	// While there remain elements to shuffle...
	while (currentIndex != 0) {
		// Pick a remaining element...
		randomIndex = Math.floor(Math.random() * currentIndex);
		currentIndex--;

		// And swap it with the current element.
		[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
	}
	return array;
}

const configDir = `${process.env.HOME}/.lvwebserver`;

/**
 * parses JSON config from '~/.lvwebserver/config'
 * @returns {Object} Parsed JSON file
 */
function getConfig() {
	if (fs.existsSync(configDir) === false) {
		var defaultConfig = {
			sessionSecrets: [],
			storeSecret: "",
			originAllowList: [], //list of URLs where CORS is enabled.
			dbURL: "", //ex. "mongodb://username:password@localhost:27017?authsource=admin"
			SSL: {
				//paths to SSL files, make sure the files have read permissions for the user you are running the server as.
				key: "",
				cert: "",
			},
			domain: "", //site FQDN, ex. lvwebserver.com
		};

		//set session secrets
		for (var i = 0; i < 11; i++) {
			defaultConfig.sessionSecrets.push(generateToken(128));
		}

		//set session store secret
		defaultConfig.storeSecret = generateToken(256);

		fs.mkdirSync(configDir);
		fs.writeFileSync(configDir + "/config", JSON.stringify(defaultConfig, null, 4));

		console.log("Created new configuration file. Please configure the settings located in '~/.lvwebserver/config'");
		process.exit();
	}

	var config = JSON.parse(fs.readFileSync(configDir + "/config", "utf-8"));

	if (config.dbURL === "") {
		throw new Error(`Error, "dbURL" in '~/.lvwebserver/config' is empty.`);
	}

	if (config.SSL.key === "") {
		throw new Error(`Error, "SSL.key" in '~/.lvwebserver/config' is empty.`);
	}

	if (config.SSL.cert === "") {
		throw new Error(`Error, "SSL.cert" in '~/.lvwebserver/config' is empty.`);
	}

	if (config.domain === "") {
		throw new Error(`Error, "domain" in '~/.lvwebserver/config' is empty.`);
	}

	//shuffle secrets
	config.sessionSecrets = shuffleArray(config.sessionSecrets);
	return config;
}

module.exports = getConfig();
