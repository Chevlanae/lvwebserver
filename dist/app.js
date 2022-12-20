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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
//**dependencies**
const favicon = require("serve-favicon");
const session = require("express-session");
const helmet_1 = __importDefault(require("helmet"));
const body_parser_1 = __importDefault(require("body-parser"));
const mongoose_1 = __importDefault(require("mongoose"));
const connect_mongo_1 = __importDefault(require("connect-mongo"));
const express_1 = __importDefault(require("express"));
const fs_1 = __importDefault(require("fs"));
const https_1 = __importDefault(require("https"));
const utils_1 = require("./utils");
const middleware = __importStar(require("./middleware"));
const routing_1 = __importDefault(require("./routing"));
//**globals**
global.config = new utils_1.Config.Handler();
global.port = 4443;
//**app**
const app = (0, express_1.default)();
//initialize db connection
mongoose_1.default.connect(config.dbURL).then((mg) => {
    app.use(middleware.rateLimiter(mg)); //rate limiter
});
//session config
app.use(session({
    cookie: { secure: true, httpOnly: true, samesite: true, maxAge: 600000, domain: config.domain },
    resave: true,
    saveUninitialized: true,
    name: config.domain + ".sid",
    secret: config.sessionSecrets.map((secret) => secret.toString("base64url")),
    store: connect_mongo_1.default.create({
        mongoUrl: config.dbURL,
        crypto: {
            secret: config.storeSecret.toString("base64url"),
        },
    }),
}));
//misc middleware
app.use(middleware.cors); //cors handler
app.use((0, helmet_1.default)()); //security headers
app.use(body_parser_1.default.json({ limit: "5mb" })); //json only body-parser
app.use(favicon(__dirname + "/public/images/favicon.ico")); //favicon
//views
app.set("view engine", "pug");
app.set("views", "./views");
//routing
app.use("/", routing_1.default);
//public files
app.use("/public", express_1.default.static("./public"));
//route all unmatched URLs to '/home'
app.get("*", function (req, res) {
    res.redirect("/home");
});
let server = https_1.default.createServer({
    key: fs_1.default.readFileSync(config.sslDir + "/privkey.pem"),
    cert: fs_1.default.readFileSync(config.sslDir + "/cert.pem"),
}, app);
//listen on given port
server.listen(port, () => console.log("Server started on port " + port.toString()));
