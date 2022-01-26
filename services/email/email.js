const nodemailer = require("nodemailer");
const config = require("../config.js");
const pug = require("pug");

async function sendTestMail(to, subject, templatePath, templateVars) {
	var template = pug.compileFile(`./templates/${templatePath}`);

	var testAccount = await nodemailer.createTestAccount();

	var transporter = nodemailer.createTransport({
		host: "smtp.ethereal.email",
		port: 587,
		secure: false, // true for 465, false for other ports
		auth: {
			user: testAccount.user, // generated ethereal user
			pass: testAccount.pass, // generated ethereal password
		},
	});

	return transporter.sendMail({
		from: `test@${config.domain}`,
		to: to,
		subject: subject,
		html: template(templateVars),
	});
}

//omg email is hard. Gonna do this later.

module.exports = sendTestMail;
