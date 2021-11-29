const nodemailer = require("nodemailer");
const fs = require("fs");
const config = require("../services/getConfig.js");

var defaultSendOptions = {
	from: config.emailConfig.defaultFromAddress,
	replyto: config.emailConfig.defaultReplyToAddress,
	cc: "",
	bcc: "",
	templateVariables: {},
	templateRootPath: config.emailConfig.templatePath,
	attachments: undefined,
};

function sendMail(to, subject, template, options = defaultSendOptions) {
	var transporter = nodemailer.createTransport(); //omg email is hard. Gonna do this later.
}
