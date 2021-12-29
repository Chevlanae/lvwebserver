const fs = require("fs");

const configDir = `${process.env.HOME}/.lvwebserver`;

//if config file does not exist
if (!fs.existsSync(configDir + "/config")) {
	function generateToken(length) {
		//token allowed characters
		var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ123456789".split("");
		var b = [];
		for (var i = 0; i < length; i++) {
			var j = (Math.random() * (a.length - 1)).toFixed(0);
			b[i] = a[j];
		}
		return b.join("");
	}

	var defaultConfig = {
		sessionSecrets: [], //cookie secrets
		storeSecret: "", //session store password
		originAllowList: [], //list of URLs where CORS is enabled.
		dbName: "",
		dbURL: "", //ex. "mongodb://username:password@localhost:27017?authsource=admin"
		//paths to SSL files, make sure the files have read permissions for the user you are running the server as.
		SSL_key: "",
		SSL_cert: "",
		domain: "", //site FQDN, ex. lvwebserver.com
	};

	//set session secrets
	for (var i = 0; i < 11; i++) {
		defaultConfig.sessionSecrets.push(generateToken(128));
	}

	//set session store secret
	defaultConfig.storeSecret = generateToken(256);

	//write file
	try {
		fs.mkdirSync(configDir);
	} catch {}

	fs.writeFileSync(configDir + "/config", JSON.stringify(defaultConfig, null, 4));

	console.log("Created new configuration file. Please configure the settings located in '~/.lvwebserver/config'");
	process.exit();
}

//read config file
const config = new Object(JSON.parse(fs.readFileSync(configDir + "/config", "utf-8")));

if (config.dbURL === "") {
	throw new Error(`"dbURL" in '~/.lvwebserver/config' is empty.`);
}

if (config.sessionSecrets.length === 0) {
	throw new Error(`"sessionSecrets" in '~/.lvwebserver/config' is empty.`);
}

if (config.storeSecret === "") {
	throw new Error(`"storeSecret" in '~/.lvwebserver/config' is empty.`);
}

if (config.SSL_key === "") {
	throw new Error(`"SSL.key" in '~/.lvwebserver/config' is empty.`);
}

if (config.SSL_cert === "") {
	throw new Error(`"SSL.cert" in '~/.lvwebserver/config' is empty.`);
}

if (config.domain === "") {
	throw new Error(`"domain" in '~/.lvwebserver/config' is empty.`);
}

module.exports = config;
