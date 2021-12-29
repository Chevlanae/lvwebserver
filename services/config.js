const conf = require("../loaders/readConfig");

class Config {
	constructor() {
		if (Object.keys(conf).length != 0) {
			//assign config file properties to this instance
			Object.assign(this, conf);

			//populate ENV variables.
			Object.keys(conf).forEach((value) => {
				if (!Object.prototype.hasOwnProperty.call(process.env, value)) {
					process.env[value] = conf[value];
				}
			});
		}
	}

	toEnv() {
		var envStr = "";

		Object.keys(conf).forEach((value) => {
			envStr = envStr + value.toUpperCase() + "=" + conf[value] + "\n";
		});

		return envStr;
	}

	/**
	 *shuffles sessionSecrets array
	 */
	async shuffleSecrets(ms) {
		var array = this.sessionSecrets;

		////Shuffle array of session secrets
		var currentIndex = array.length,
			randomIndex;

		// While there remain elements to shuffle...
		while (currentIndex != 0) {
			// Pick a remaining element...
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;

			// And swap it with the current element.
			[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
		}

		process.env.sessionSecrets = array;
		this.sessionSecrets = array;
	}
}

const config = new Config();

module.exports = config;
