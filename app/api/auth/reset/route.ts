import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { sendResetEmail } from "@/src/lib/mail";
import crypto from "crypto";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();

    if (!email || !emailRegex.test(email)) {
      return NextResponse.json({ error: "A valid email address is required." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 3600000);

      await prisma.verificationToken.create({
        data: {
          identifier: email,
          token,
          expires,
        },
      });

      await sendResetEmail(email, token);
    }

    return NextResponse.json({ message: "If an account exists, a reset link has been sent." });
  } catch (error) {
    console.error("RESET_ERROR", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
