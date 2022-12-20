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
exports.User = void 0;
const mongoose_1 = require("mongoose");
const argon2 = __importStar(require("argon2"));
const crypto_1 = require("crypto");
var User;
(function (User) {
    User.ModelSchema = new mongoose_1.Schema({
        username: { type: String, index: true, required: true },
        password: { type: String },
        email: {
            value: { type: String, required: true },
            verified: { type: Boolean, default: false, required: true },
        },
        permissions: {
            filesystem: {
                read: { type: Boolean, default: false, required: true },
                write: { type: Boolean, default: false, required: true },
            },
            roles: {
                user: { type: Boolean, default: true, required: true },
                superUser: { type: Boolean, default: false, required: true },
                admin: { type: Boolean, default: false, required: true },
                owner: { type: Boolean, default: false, required: true },
            },
        },
        secret: { type: Buffer, default: (0, crypto_1.randomBytes)(512), required: true },
    }, { collection: "users" });
    User.ModelSchema.method("setPassword", async function (newPassword) {
        this.password = await argon2.hash(newPassword, {
            type: argon2.argon2id,
            memoryCost: 2 ** 16,
        });
    });
    User.ModelSchema.method("checkPassword", async function (password) {
        return this?.password !== undefined && (await argon2.verify(this.password, password));
    });
    User.Model = (0, mongoose_1.model)("BaseType", User.ModelSchema);
})(User = exports.User || (exports.User = {}));
