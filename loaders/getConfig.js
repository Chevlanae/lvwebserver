const config = require("../config/config.json");
const pem = require("pem");
const fs = require("fs");

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
		[array[currentIndex], array[randomIndex]] = [
			array[randomIndex],
			array[currentIndex],
		];
	}
	return array;
}
//shuffle secrets
config.sessionSecrets = shuffleArray(config.sessionSecrets);

//if cert does not exist, create new selfsigned cert and write to config.json
if (!config.SSL || (config.SSL.key == "" && config.SSL.cert == "")) {
	pem.createCertificate({ selfSigned: true }, function (err, keys) {
		if (err) {
			throw err;
		}

		config.SSL = {
			key: keys.clientKey,
			cert: keys.certificate,
		};
	});
}

fs.writeFile("./config/config.json", JSON.stringify(config, null, 4), null);
