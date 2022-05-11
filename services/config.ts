import { randomBytes } from "crypto";
import * as fs from "fs";

export declare namespace ConfigService {
	interface ConfigData {
		sessionSecrets: Buffer[];
		storeSecret: Buffer;
		originAllowList: string[];
		dbName: string;
		dbURL: `mongodb://${string}:${string}@${string}?authSource=admin`;
		sslDir: string;
		domain: string;
	}

	interface ConfigDataJSON {
		sessionSecrets: string[];
		storeSecret: string;
		originAllowList: string[];
		dbName: string;
		dbURL: `mongodb://${string}:${string}@${string}?authSource=admin`;
		sslDir: string;
		domain: string;
	}

	class ConfigHandler {
		filepath: string;
		read(): ConfigData;
		write(data: ConfigData): void;
	}
}

export class Config implements ConfigService.ConfigHandler {
	constructor(filepath?: string) {
		if (filepath) this.filepath = filepath;
		else if (process.env?.HOME) this.filepath = process.env.HOME + "/.lvwebserver/config.json";
		else this.filepath = process.cwd() + "/config.json";

		this.#config = this.read();
	}

	filepath: string;

	#config: ConfigService.ConfigData;

	get data() {
		return this.#config;
	}

	set data(config) {
		this.#config = {
			...this.#config,
			...config,
		};

		this.write(this.#config);
	}

	get sessionSecrets() {
		return this.data.sessionSecrets;
	}

	set sessionSecrets(value: Buffer[]) {
		this.data.sessionSecrets = value;

		this.write(this.#config);
	}

	get storeSecret() {
		return this.data.storeSecret;
	}

	set storeSecret(value: Buffer) {
		this.data.storeSecret = value;

		this.write(this.#config);
	}

	get originAllowList() {
		return this.data.originAllowList;
	}

	set originAllowList(value: string[]) {
		this.data.originAllowList = value;

		this.write(this.#config);
	}

	get dbName() {
		return this.data.dbName;
	}

	set dbName(value: string) {
		this.data.dbName = value;

		this.write(this.#config);
	}

	get dbURL() {
		return this.data.dbURL;
	}

	set dbURL(value: `mongodb://${string}:${string}@${string}?authSource=admin`) {
		this.data.dbURL = value;

		this.write(this.#config);
	}

	get sslDir() {
		return this.data.sslDir;
	}

	set sslDir(value: string) {
		this.data.sslDir = value;

		this.write(this.#config);
	}

	get domain() {
		return this.data.domain;
	}

	set domain(value: string) {
		this.data.domain = value;

		this.write(this.#config);
	}

	read(): ConfigService.ConfigData {
		try {
			let configFile = fs.readFileSync(this.filepath, "utf-8"),
				data: ConfigService.ConfigDataJSON = JSON.parse(configFile);

			return {
				...data,
				sessionSecrets: data.sessionSecrets.map((value) => Buffer.from(value, "base64url")),
				storeSecret: Buffer.from(data.storeSecret, "base64url"),
			};
		} catch (err) {
			if (!fs.existsSync(this.filepath)) {
				console.error(`Cannot read config file. File at "${this.filepath}" does not exist.`);

				let generatedSessionSecrets = new Array(10);

				for (let i = 0; i < generatedSessionSecrets.length; i++) generatedSessionSecrets[i] = randomBytes(2 ** 6);

				this.write({
					sessionSecrets: generatedSessionSecrets,
					storeSecret: randomBytes(2 ** 6),
					originAllowList: [],
					dbName: "lvwebserver",
					dbURL: `mongodb://username:password@host?authSource=admin`,
					sslDir: "path/to/ssl",
					domain: "development.example.com",
				}).then(() => {
					console.log(`New config file created at '${this.filepath}', please add the required settings before starting the server`);
					process.exit();
				});

				return this.data;
			} else {
				throw err;
			}
		}
	}

	async write(data: ConfigService.ConfigData) {
		let json: ConfigService.ConfigDataJSON = {
				...data,
				sessionSecrets: data.sessionSecrets.map((value) => value.toString("base64url")),
				storeSecret: data.storeSecret.toString("base64url"),
			},
			configFile = JSON.stringify(json, null, 2);

		await fs.promises.writeFile(this.filepath, configFile, "utf-8");
	}
}
