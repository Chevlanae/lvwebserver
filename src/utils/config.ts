import { randomBytes } from "crypto";
import * as path from "path";
import * as fs from "fs";

type json = {
	sessionSecret: string;
	storeSecret: string;
	originAllowList: string[];
	dbName: string;
	dbURL: string;
	domain: string;
};

export class Config implements json {
	filePath;
	directoryPath;
	#data;

	constructor(directoryPath?: string) {
		if (directoryPath) this.directoryPath = path.resolve(directoryPath);
		else if (process.env?.HOME) this.directoryPath = path.resolve(process.env.HOME + "/.lvwebserver");
		else this.directoryPath = path.resolve(process.cwd());

		this.filePath = path.resolve(this.directoryPath + "/config.json");

		//if config file is not detected
		if (!fs.existsSync(this.filePath)) {
			console.error(`Cannot read config file. File at "${this.filePath}" does not exist.`);

			if (!fs.existsSync(this.directoryPath)) {
				//mkdir ~/.lvwebserver
				fs.mkdirSync(this.directoryPath);
			}

			//create new config file
			fs.writeFileSync(
				this.filePath,
				JSON.stringify({
					sessionSecret: randomBytes(2 ** 8).toString("base64url"),
					storeSecret: randomBytes(2 ** 8).toString("base64url"),
					originAllowList: ["development.example.com", "example.com"],
					dbName: "lvwebserver",
					dbURL: `mongodb://username:password@127.0.0.1?authSource=admin`,
					domain: "development.example.com",
				})
			);

			console.log(`New config file created at '${this.filePath}', please set the correct configuration before running the server.`);
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

	get sessionSecret() {
		return this.#data.sessionSecret;
	}

	set sessionSecret(value) {
		this.#data.sessionSecret = value;
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

	get domain() {
		return this.#data.domain;
	}

	set domain(value) {
		this.#data.domain = value;
	}

	read(): json {
		return (this.#data = JSON.parse(fs.readFileSync(this.filePath, "utf-8")));
	}
}
