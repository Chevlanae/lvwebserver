import * as nodemailer from "nodemailer";
import { MailOptions } from "nodemailer/lib/sendmail-transport";
import SMTPTransport from "nodemailer/lib/smtp-transport";

export namespace Email {
	//nodemailer transporter options
	export const transporterOptions = {
		sendmail: { sendmail: true, newline: "unix", path: "/usr/sbin/sendmail" },
	};

	/**
	 * High level wrapper for nodemailer with async support because nodemailer sucks
	 */
	export class Transporter {
		constructor(option: keyof typeof transporterOptions) {
			//set transporter with selected option
			this.#transporter = nodemailer.createTransport(<any>transporterOptions[option]);
		}

		#transporter;

		//
		send(options: MailOptions): Promise<SMTPTransport.SentMessageInfo> {
			return new Promise((resolve, reject) =>
				this.#transporter.sendMail({ from: "no-reply@" + config.domain, ...options }, (err, info) => {
					if (err !== null) reject(err);
					else resolve(info);
				})
			);
		}
	}
}
