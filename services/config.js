const dotenv = require("dotenv");
const fs = require("fs").promises;

const readConfig = require("../loaders/config");

class Config {
	#local;
	constructor() {
		//save
		this.#local = readConfig();

		//write .env file and load it into process.env
		fs.writeFile(".env", this.toEnv()).then(() => dotenv.config());
	}

	toEnv() {
		let envStr = "";

		Object.keys(this.#local).forEach((value) => {
			envStr = envStr + value.toUpperCase() + "=" + this.#local[value] + "\n";
		});

		return envStr;
	}

	toJson() {
		return JSON.stringify(this.#local);
	}

	/**
	 *shuffles sessionSecrets array
	 */
	async shuffleSecrets() {
		var array = this.#local.sessionSecrets;

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

		this.sessionSecrets = array;
	}
}

module.exports = new Config();
