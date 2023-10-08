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
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
class Config {
    filePath;
    directoryPath;
    #data;
    constructor(directoryPath) {
        if (directoryPath)
            this.directoryPath = path.resolve(directoryPath);
        else if (process.env?.HOME)
            this.directoryPath = path.resolve(process.env.HOME + "/.lvwebserver");
        else
            this.directoryPath = path.resolve(process.cwd());
        this.filePath = path.resolve(this.directoryPath + "/config.json");
        //if config file is not detected
        if (!fs.existsSync(this.filePath)) {
            console.error(`Cannot read config file. File at "${this.filePath}" does not exist.`);
            if (!fs.existsSync(this.directoryPath)) {
                //mkdir ~/.lvwebserver
                fs.mkdirSync(this.directoryPath);
            }
            //create new config file
            fs.writeFileSync(this.filePath, JSON.stringify({
                sessionSecret: (0, crypto_1.randomBytes)(2 ** 8).toString("base64url"),
                storeSecret: (0, crypto_1.randomBytes)(2 ** 8).toString("base64url"),
                originAllowList: ["development.example.com", "example.com"],
                dbName: "lvwebserver",
                dbURL: `mongodb://username:password@127.0.0.1?authSource=admin`,
                domain: "development.example.com",
            }));
            console.log(`New config file created at '${this.filePath}', please set the correct configuration before running the server.`);
            process.exit();
        }
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
    read() {
        return (this.#data = JSON.parse(fs.readFileSync(this.filePath, "utf-8")));
    }
}
exports.Config = Config;
//# sourceMappingURL=config.js.map