"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parameters = void 0;
exports.Parameters = {
    login: {
        username: {
            in: ["query", "body"],
            exists: true,
            isString: true,
            trim: true,
        },
        password: {
            in: ["query", "body"],
            exists: true,
            isString: true,
            trim: true,
        },
    },
    signup: {
        email: {
            in: ["query", "body"],
            exists: true,
            isString: true,
            trim: true,
            isEmail: true,
            isLength: {
                errorMessage: "Email cannot be longer than 50 characters.",
                options: { max: 50 },
            },
        },
        username: {
            in: ["query", "body"],
            exists: true,
            isString: true,
            trim: true,
            isLength: {
                errorMessage: "Username must be between 5 and 30 characters long.",
                options: { min: 5, max: 30 },
            },
        },
        password: {
            in: ["query", "body"],
            exists: true,
            isString: true,
            trim: true,
            isLength: {
                errorMessage: "Password must be between 13 and 30 characters long.",
                options: { min: 13, max: 30 },
            },
            custom: {
                options: (value) => {
                    //! Custom regex requirements
                    //? format: [regex string, desired test result]
                    let regex = [
                        [`[A-Z]`, true],
                        [`[0-9]`, true],
                        [`[^a-zA-Z0-9_]`, true],
                        [`/ `, false], //No spaces
                    ];
                    return regex.every((regexOptions) => RegExp(regexOptions[0]).test(value) === regexOptions[1]);
                },
                errorMessage: "Missing either a capital letter, a number, a special character, or the password contains a space.",
            },
        },
    },
    confirm: { token: { in: ["query", "body"], optional: true, isBase64: { options: { urlSafe: true } } } },
};
//# sourceMappingURL=schemas.js.map