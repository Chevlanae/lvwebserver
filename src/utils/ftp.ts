import type * as ftp from "ftp";
import type { ConnectionOptions } from "tls";

const ftpClient = require("ftp");

//reason for this util?
//grug no like callbacks

export namespace FTP {
	type connectionConfig = {
		host: string;
		user: string;
		password: string;
		secure: boolean;
		connTimeout?: number;
		keepalive?: number;
		secureOptions?: ConnectionOptions;
	};

	export class handler {
		config: connectionConfig;

		client: ftp;

		constructor(config: connectionConfig) {
			this.config = config;

			this.client = new ftpClient();

			this.client.on("ready", () => console.log(`FTP client connected to '${config.host}' as '${config.user}'.`));

			this.client.on("error", (err) => console.error(`FTP client encountered an error while connected to '${config.host}'.\n${err.toString()}`));

			this.client.on("close", (hadErr) => hadErr && console.log(`FTP client connected to '${config.host}' disconnected after encountering an error.`));

			this.client.connect(config);
		}

		list(path?: string): Promise<ftp.ListingElement[]> {
			return new Promise((resolve, reject) => {
				this.client.list(path ?? "", false, (err, list) => (err ? reject(err) : resolve(list)));
			});
		}

		upload(file: string | NodeJS.ReadableStream | Buffer, destPath: string): Promise<void> {
			return new Promise((resolve, reject) => {
				this.client.lastMod(destPath, (err) => {
					if (err) this.client.put(file, destPath, false, (err) => (err ? reject(err) : resolve()));
					else this.client.append(file, destPath, false, (err) => (err ? reject(err) : resolve()));
				});
			});
		}

		download(filePath: string): Promise<NodeJS.ReadableStream> {
			return new Promise((resolve, reject) => {
				this.client.get(filePath, (err, stream) => (err ? reject(err) : resolve(stream)));
			});
		}

		rename(oldPath: string, newPath: string): Promise<void> {
			return new Promise((resolve, reject) => {
				this.client.rename(oldPath, newPath, (err) => (err ? reject(err) : resolve()));
			});
		}

		delete(filePath: string): Promise<void> {
			return new Promise((resolve, reject) => {
				this.client.delete(filePath, (err) => (err ? reject(err) : resolve()));
			});
		}

		cwd(newPath: string): Promise<string | undefined> {
			return new Promise((resolve, reject) => {
				this.client.cwd(newPath, (err, currentDir) => (err ? reject(err) : resolve(currentDir)));
			});
		}

		pwd(): Promise<string> {
			return new Promise((resolve, reject) => {
				this.client.pwd((err, path) => (err ? reject(err) : resolve(path)));
			});
		}

		mkdir(path: string): Promise<void> {
			return new Promise((resolve, reject) => {
				this.client.mkdir(path, true, (err) => (err ? reject(err) : resolve()));
			});
		}

		rmdir(path: string): Promise<void> {
			return new Promise((resolve, reject) => {
				this.client.rmdir(path, true, (err) => (err ? reject(err) : resolve()));
			});
		}

		size(path: string): Promise<number> {
			return new Promise((resolve, reject) => {
				this.client.size(path, (err, size) => (err ? reject(err) : resolve(size)));
			});
		}

		lastMod(path: string): Promise<Date> {
			return new Promise((resolve, reject) => {
				this.client.lastMod(path, (err, lastMod) => (err ? reject(err) : resolve(lastMod)));
			});
		}

		status(): Promise<string> {
			return new Promise((resolve, reject) => {
				this.client.status((err, status) => (err ? reject(err) : resolve(status)));
			});
		}

		reconnect() {
			this.client.end();

			this.client.connect(this.config);
		}
	}
}
