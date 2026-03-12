import { prisma } from "@/src/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

// Store in .env in production
const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey";
const JWT_EXPIRES_IN = "7d";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.email || !body.password || !body.name) {
      return Response.json(
        { error: "Invalid input" },
        { status: 400 }
      );
    }

    // 1. Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      return Response.json(
        { error: "User already exists" },
        { status: 409 }
      );
    }

    // 2. Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // 3. Create user
    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        password: hashedPassword,
        role: body.role || "USER", // default role USER
      },
    });

    // 4. Generate JWT token
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    // 5. Return user info + token
    return Response.json(
      {
        message: "Signup successful",
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}