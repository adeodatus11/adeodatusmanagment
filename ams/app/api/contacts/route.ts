import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search");

  const contacts = await prisma.contact.findMany({
    where: search
      ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { organization: { contains: search } },
            { role: { contains: search } },
          ],
        }
      : {},
    include: {
      _count: { select: { tasks: true, logs: true } },
    },
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }],
  });
  return NextResponse.json(contacts);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const contact = await prisma.contact.create({
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      organization: body.organization,
      role: body.role,
      email: body.email,
      phone: body.phone,
      notes: body.notes,
    },
  });
  return NextResponse.json(contact);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const contact = await prisma.contact.update({
    where: { id: body.id },
    data: {
      firstName: body.firstName,
      lastName: body.lastName,
      organization: body.organization,
      role: body.role,
      email: body.email,
      phone: body.phone,
      notes: body.notes,
    },
  });
  return NextResponse.json(contact);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")!;
  await prisma.contact.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
