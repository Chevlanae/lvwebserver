"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Config = void 0;
const crypto_1 = require("crypto");
const fs = __importStar(require("fs"));
var Config;
(function (Config) {
    class Handler {
        filepath;
        #data;
        constructor(filepath) {
            if (filepath)
                this.filepath = filepath;
            else if (process.env?.HOME)
                this.filepath = process.env.HOME + "/.lvwebserver/config.json";
            else
                this.filepath = process.cwd() + "/config.json";
            this.#data = this.read();
        }
        get data() {
            return this.#data;
        }
        set data(config) {
            this.#data = {
                ...this.#data,
                ...config,
            };
            this.write();
        }
        get sessionSecrets() {
            //shuffle array every time the getter is called
            let secrets = this.#data.sessionSecrets, currentIndex = secrets.length, randomIndex;
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
        read() {
            //if file exists, return contents and save to this.#data
            if (fs.existsSync(this.filepath))
                return (this.#data = JSON.parse(fs.readFileSync(this.filepath, "utf-8")));
            //else create a new file and call process.exit()
            else {
                console.error(`Cannot read config file. File at "${this.filepath}" does not exist.`);
                this.write({
                    sessionSecrets: new Array(10).map(() => (0, crypto_1.randomBytes)(2 ** 8)),
                    storeSecret: (0, crypto_1.randomBytes)(2 ** 8),
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
        async write(data) {
            let outFile;
            //stringify this.#data
            if (data === undefined)
                outFile = JSON.stringify(this.#data, null, 2);
            else
                outFile = JSON.stringify({ ...this.#data, data }, null, 2);
            //write outFile
            await fs.promises.writeFile(this.filepath, outFile, "utf-8");
        }
    }
    Config.Handler = Handler;
})(Config = exports.Config || (exports.Config = {}));
