import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const services = await prisma.service.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json(services);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized. Admin role required." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, description, category } = body;

    if (!name) {
      return NextResponse.json({ error: "Service name is required" }, { status: 400 });
    }

    const service = await prisma.service.create({
      data: { name, description, category },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
