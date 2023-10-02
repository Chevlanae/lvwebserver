import { randomBytes } from "crypto";
import * as path from "path";
import * as fs from "fs";

type json = {
	sessionSecrets: Array<Buffer>;
	storeSecret: Buffer;
	originAllowList: string[];
	dbName: string;
	dbURL: `mongodb://${string}:${string}@${string}?authSource=admin`;
	sslDir: string;
	domain: string;
};

export class Config implements json {
	filepath;

	#data;

	constructor(filepath?: string) {
		if (filepath) this.filepath = path.resolve(filepath);
		else if (process.env?.HOME) this.filepath = path.resolve(process.env.HOME + "/.lvwebserver/config.json");
		else this.filepath = path.resolve(process.cwd() + "/config.json");

		//if config file is not detected
		if (!fs.existsSync(this.filepath)) {
			console.error(`Cannot read config file. File at "${this.filepath}" does not exist.`);

			//mkdir ~/.lvwebserver
			fs.mkdirSync(this.filepath.slice(0, -12));

			//create new config file
			fs.writeFileSync(
				this.filepath,
				JSON.stringify({
					sessionSecrets: [].map(() => randomBytes(2 ** 8)),
					storeSecret: randomBytes(2 ** 8),
					originAllowList: ["development.example.com", "example.com"],
					dbName: "lvwebserver",
					dbURL: `mongodb://username:password@127.0.0.1?authSource=admin`,
					sslDir: "path/to/ssl",
					domain: "development.example.com",
				})
			);

			console.log(`New config file created at '${this.filepath}', please set the correct configuration before running the server.`);
			process.exit();
		}

		this.#data = this.read();
	}

	get data(): json {
		return this.#data;
	}

	set data(config: json) {
		this.#data = {
			...this.#data,
			...config,
		};
	}

	get sessionSecrets() {
		//shuffle array every time the getter is called

		let secrets = this.#data.sessionSecrets,
			currentIndex = secrets.length,
			randomIndex;

		// While there remain elements to shuffle.
		while (currentIndex != 0) {
			// Pick a remaining element.
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;

			// And swap it with the current element.
			[secrets[currentIndex], secrets[randomIndex]] = [secrets[randomIndex], secrets[currentIndex]];
		}

		return secrets;
	}

	set sessionSecrets(value) {
		this.#data.sessionSecrets = value;
	}

	get storeSecret() {
		return this.#data.storeSecret;
	}

	set storeSecret(value) {
		this.#data.storeSecret = value;
	}

	get originAllowList() {
		return this.#data.originAllowList;
	}

	set originAllowList(value) {
		this.#data.originAllowList = value;
	}

	get dbName() {
		return this.#data.dbName;
	}

	set dbName(value) {
		this.#data.dbName = value;
	}

	get dbURL() {
		return this.#data.dbURL;
	}

	set dbURL(value) {
		this.#data.dbURL = value;
	}

	get sslDir() {
		return this.#data.sslDir;
	}

	set sslDir(value) {
		this.#data.sslDir = value;
	}

	get domain() {
		return this.#data.domain;
	}

	set domain(value) {
		this.#data.domain = value;
	}

	read(): json {
		return (this.#data = JSON.parse(fs.readFileSync(this.filepath, "utf-8")));
	}
}
