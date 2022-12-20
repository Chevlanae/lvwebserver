"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FTP = void 0;
const ftpClient = require("ftp");
//reason for this util?
//me no like callbacks.
var FTP;
(function (FTP) {
    class handler {
        config;
        client;
        constructor(config) {
            this.config = config;
            this.client = new ftpClient();
            this.client.on("ready", () => console.log(`FTP client connected to '${config.host}' as '${config.user}'.`));
            this.client.on("error", (err) => console.error(`FTP client encountered an error while connected to '${config.host}'.\n${err.toString()}`));
            this.client.on("close", (hadErr) => hadErr && console.log(`FTP client connected to '${config.host}' disconnected after encountering an error.`));
            this.client.connect(config);
        }
        list(path) {
            return new Promise((resolve, reject) => {
                this.client.list(path ?? "", false, (err, list) => (err ? reject(err) : resolve(list)));
            });
        }
        upload(file, destPath) {
            return new Promise((resolve, reject) => {
                this.client.lastMod(destPath, (err) => {
                    if (err)
                        this.client.put(file, destPath, false, (err) => (err ? reject(err) : resolve()));
                    else
                        this.client.append(file, destPath, false, (err) => (err ? reject(err) : resolve()));
                });
            });
        }
        download(filePath) {
            return new Promise((resolve, reject) => {
                this.client.get(filePath, (err, stream) => (err ? reject(err) : resolve(stream)));
            });
        }
        rename(oldPath, newPath) {
            return new Promise((resolve, reject) => {
                this.client.rename(oldPath, newPath, (err) => (err ? reject(err) : resolve()));
            });
        }
        delete(filePath) {
            return new Promise((resolve, reject) => {
                this.client.delete(filePath, (err) => (err ? reject(err) : resolve()));
            });
        }
        cwd(newPath) {
            return new Promise((resolve, reject) => {
                this.client.cwd(newPath, (err, currentDir) => (err ? reject(err) : resolve(currentDir)));
            });
        }
        pwd() {
            return new Promise((resolve, reject) => {
                this.client.pwd((err, path) => (err ? reject(err) : resolve(path)));
            });
        }
        mkdir(path) {
            return new Promise((resolve, reject) => {
                this.client.mkdir(path, true, (err) => (err ? reject(err) : resolve()));
            });
        }
        rmdir(path) {
            return new Promise((resolve, reject) => {
                this.client.rmdir(path, true, (err) => (err ? reject(err) : resolve()));
            });
        }
        size(path) {
            return new Promise((resolve, reject) => {
                this.client.size(path, (err, size) => (err ? reject(err) : resolve(size)));
            });
        }
        lastMod(path) {
            return new Promise((resolve, reject) => {
                this.client.lastMod(path, (err, lastMod) => (err ? reject(err) : resolve(lastMod)));
            });
        }
        status() {
            return new Promise((resolve, reject) => {
                this.client.status((err, status) => (err ? reject(err) : resolve(status)));
            });
        }
        reconnect() {
            this.client.end();
            this.client.connect(this.config);
        }
    }
    FTP.handler = handler;
})(FTP = exports.FTP || (exports.FTP = {}));
