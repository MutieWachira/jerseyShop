import { prisma } from "@/src/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Ideally, store this in .env
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const JWT_EXPIRES_IN = "7d"; // Token valid for 7 days

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    // 1. Find user in the database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // 2. Compare password with hashed password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return Response.json({ error: "Invalid email or password" }, { status: 401 });
    }

    // 3. Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role }, // include role if needed
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 4. Return user info + token
    return Response.json(
      {
        message: "Login successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}