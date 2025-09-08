import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = (await req.json()) as { name?: string; email?: string; password?: string };
    if (!email || !password) return NextResponse.json({ error: "Missing email or password" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return NextResponse.json({ error: "Email already in use" }, { status: 409 });

    const passwordHash = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { email, name: name || null, passwordHash, role: "CUSTOMER" } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    // Normalize common Prisma errors for better UX
    if (typeof message === "string") {
      if (message.includes("Can't reach database server") || message.includes("P1001")) {
        return NextResponse.json({ error: "Database is not reachable. Please start your database and try again." }, { status: 503 });
      }
      if (message.includes("Unique constraint") || message.includes("P2002")) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 });
      }
    }
    return NextResponse.json({ error: message || "Internal Server Error" }, { status: 500 });
  }
}


