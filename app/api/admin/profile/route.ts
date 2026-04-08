import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/src/lib/auth";
import { prisma } from "@/src/lib/prisma";
import bcrypt from "bcrypt";

export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, currentPassword, newPassword } = body ?? {};

    const adminId = session.user.id;

    if (!adminId) {
      return NextResponse.json({ error: "Session missing user ID" }, { status: 401 });
    }

    const updateData: { name?: string; password?: string } = {};

    // Name update
    if (name !== undefined) {
      const trimmed = String(name).trim();
      if (!trimmed) {
        return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
      }
      updateData.name = trimmed;
    }

    // Password update — only if both fields provided
    if (newPassword !== undefined || currentPassword !== undefined) {
      if (!currentPassword || !newPassword) {
        return NextResponse.json(
          { error: "Both current and new password are required to change password" },
          { status: 400 }
        );
      }

      if (String(newPassword).length < 8) {
        return NextResponse.json(
          { error: "New password must be at least 8 characters" },
          { status: 400 }
        );
      }

      // Fetch current hashed password
      const user = await prisma.user.findUnique({
        where: { id: adminId },
        select: { password: true },
      });

      if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }

      // ✅ Fix for Vercel/TypeScript error:
      // Narrow the type to ensure password is not null (OAuth users won't have a password)
      if (!user.password) {
        return NextResponse.json(
          { error: "Accounts registered via Google/Apple cannot change passwords here. Use the provider settings." },
          { status: 400 }
        );
      }

      // Now user.password is guaranteed to be a string
      const valid = await bcrypt.compare(String(currentPassword), user.password);
      if (!valid) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 403 });
      }

      updateData.password = await bcrypt.hash(String(newPassword), 12);
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.user.update({
      where: { id: adminId },
      data: updateData,
      select: { id: true, name: true, email: true },
    });

    return NextResponse.json({ success: true, user: updated });
  } catch (err) {
    console.error("PATCH profile error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
