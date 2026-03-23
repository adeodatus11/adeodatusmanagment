import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");

  const events = await prisma.event.findMany({
    where: projectId ? { projectId } : {},
    include: { project: { select: { name: true, area: { select: { color: true } } } } },
    orderBy: { date: "asc" },
  });
  return NextResponse.json(events);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const event = await prisma.event.create({
    data: {
      title: body.title,
      date: new Date(body.date),
      time: body.time,
      notes: body.notes,
      projectId: body.projectId || null,
    },
    include: { project: { select: { name: true, area: { select: { color: true } } } } },
  });
  return NextResponse.json(event);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")!;
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
