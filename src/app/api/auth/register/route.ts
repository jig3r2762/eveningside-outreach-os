import { NextResponse } from "next/server";
import prisma from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { logAuditEvent } from "@/lib/audit";

const registerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["ADMIN", "SALES", "RESEARCH", "VIEWER"]).default("SALES"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = registerSchema.safeParse(body);

    if (!validated.success) {
      return NextResponse.json(
        { error: validated.error.issues[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const email = validated.data.email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 400 }
      );
    }

    const passwordHash = await bcrypt.hash(validated.data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: validated.data.name.trim(),
        email,
        passwordHash,
        role: validated.data.role,
        active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    // Log audit event
    await logAuditEvent({
      userId: user.id,
      action: "USER_REGISTERED",
      entityType: "User",
      entityId: user.id,
      newValues: { email: user.email, name: user.name, role: user.role },
      source: "SIGN_UP_PORTAL",
    });

    return NextResponse.json({
      success: true,
      user,
      message: "Account created successfully",
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create account" },
      { status: 500 }
    );
  }
}
