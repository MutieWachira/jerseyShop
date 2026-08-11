import nodemailer from "nodemailer";

const canSendEmail = Boolean(process.env.EMAIL_USER && process.env.EMAIL_PASS);
const transporter = canSendEmail
  ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  : null;

const defaultFrom = process.env.EMAIL_FROM || '"Jersey Shop" <noreply@jerseyshop.com>';

async function sendMail(options: {
  from?: string;
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    content: string | Buffer;
    contentType?: string;
  }>;
}) {
  if (!transporter) {
    console.warn("[email] EMAIL_USER or EMAIL_PASS is not configured. Email will not be sent.", options);
    return false;
  }

  try {
    await transporter.sendMail({
      from: options.from || defaultFrom,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments,
    });
    return true;
  } catch (error) {
    console.error("[email] sendMail failed", error);
    return false;
  }
}

export const resend = {
  emails: {
    send: sendMail,
  },
};
