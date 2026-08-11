import nodemailer from "nodemailer";

const baseUrl = process.env.NEXTAUTH_URL?.trim().replace(/\/+$/, "") || "http://localhost:3000";
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

export const sendResetEmail = async (email: string, token: string) => {
  const resetLink = `${baseUrl}/reset-password/${token}`;

  if (!transporter) {
    console.warn(
      "[mail] EMAIL_USER or EMAIL_PASS is not configured. Reset link will be logged for development:",
      resetLink
    );
    return;
  }

  try {
    await transporter.sendMail({
      from: '"Jersey Shop" <noreply@jerseyshop.com>',
      to: email,
      subject: "Reset your password",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
    });
  } catch (error) {
    console.error("[mail] sendResetEmail failed", error);
    if (process.env.NODE_ENV !== "production") {
      console.warn("[mail] fallback reset link:", resetLink);
    }
  }
};
