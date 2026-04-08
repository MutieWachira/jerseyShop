import { NextResponse } from "next/server";
import { prisma } from "@/src/lib/prisma";
import { sendResetEmail } from "@/src/lib/mail"; // Import your utility
import crypto from "crypto";

export async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    // 1. Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    // 2. Security Best Practice: Don't tell the user if the email was found.
    // Just return success regardless, but only send the email if the user exists.
    if (user) {
      // 3. Generate a secure random token
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 3600000); // Expires in 1 hour

      // 4. Save token to VerificationToken table
      // We use upsert to update the token if one already exists for this email
      await prisma.verificationToken.upsert({
        where: { identifier_token: { identifier: email, token } },
        update: { token, expires },
        create: {
          identifier: email,
          token,
          expires,
        },
      });

      // 5. Send the email
      await sendResetEmail(email, token);
    }

    return NextResponse.json({ 
      message: "If an account exists, a reset link has been sent." 
    });

  } catch (error) {
    console.error("RESET_ERROR", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
