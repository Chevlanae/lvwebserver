const nodemailer = require("nodemailer");
const fs = require("fs");
const config = require("../services/getConfig.js");

var defaultSendMailOptions = {
	from: config.emailConfig.defaultFromAddress,
	replyto: config.emailConfig.defaultReplyToAddress,
	cc: "",
	bcc: "",
	templateVariables: {},
	templateRootPath: config.emailConfig.templatePath,
	attachments: undefined,
};

function sendMail(to, subject, template, options = defaultSendMailOptions) {
	var transporter = nodemailer.createTransport(); //omg email is hard. Gonna do this later.
}
