import { randomBytes } from "crypto";
import * as fs from "fs";

export namespace Config {
	type json = {
		sessionSecrets: Array<Buffer>;
		storeSecret: Buffer;
		originAllowList: string[];
		dbName: string;
		dbURL: `mongodb://${string}:${string}@${string}?authSource=admin`;
		sslDir: string;
		domain: string;
	};

	export class Handler implements json {
		filepath;

		#data;

		constructor(filepath?: string) {
			if (filepath) this.filepath = filepath;
			else if (process.env?.HOME) this.filepath = process.env.HOME + "/.lvwebserver/config.json";
			else this.filepath = process.cwd() + "/config.json";

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

			this.write();
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

			this.write();
		}

		get storeSecret() {
			return this.#data.storeSecret;
		}

		set storeSecret(value) {
			this.#data.storeSecret = value;

			this.write();
		}

		get originAllowList() {
			return this.#data.originAllowList;
		}

		set originAllowList(value) {
			this.#data.originAllowList = value;

			this.write();
		}

		get dbName() {
			return this.#data.dbName;
		}

		set dbName(value) {
			this.#data.dbName = value;

			this.write();
		}

		get dbURL() {
			return this.#data.dbURL;
		}

		set dbURL(value) {
			this.#data.dbURL = value;

			this.write();
		}

		get sslDir() {
			return this.#data.sslDir;
		}

		set sslDir(value) {
			this.#data.sslDir = value;

			this.write();
		}

		get domain() {
			return this.#data.domain;
		}

		set domain(value) {
			this.#data.domain = value;

			this.write();
		}

		read(): json {
			//if file exists, return contents and save to this.#data
			if (fs.existsSync(this.filepath)) return (this.#data = JSON.parse(fs.readFileSync(this.filepath, "utf-8")));
			//else create a new file and call process.exit()
			else {
				console.error(`Cannot read config file. File at "${this.filepath}" does not exist.`);

				this.write({
					sessionSecrets: new Array<Buffer>(10).map(() => randomBytes(2 ** 8)),
					storeSecret: randomBytes(2 ** 8),
					originAllowList: ["development.example.com", "example.com"],
					dbName: "lvwebserver",
					dbURL: `mongodb://username:password@127.0.0.1?authSource=admin`,
					sslDir: "path/to/ssl",
					domain: "development.example.com",
				}).then(() => {
					console.log(`New config file created at '${this.filepath}', please set the correct configuration before running the server.`);
					process.exit();
				});

				return this.#data;
			}
		}

		async write(data?: json) {
			let outFile;

			//stringify this.#data
			if (data === undefined) outFile = JSON.stringify(this.#data, null, 2);
			else outFile = JSON.stringify({ ...this.#data, data }, null, 2);

			//write outFile
			await fs.promises.writeFile(this.filepath, outFile, "utf-8");
		}
	}
}
