import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DEFAULT_AREAS } from "@/lib/constants";

export async function GET() {
  const areas = await prisma.area.findMany({ orderBy: { order: "asc" }, include: { _count: { select: { projects: true } } } });
  return NextResponse.json(areas);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  if (body.seed) {
    const existing = await prisma.area.count();
    if (existing === 0) {
      await prisma.area.createMany({ data: DEFAULT_AREAS.map((a, i) => ({ ...a, order: i })) });
    }
    return NextResponse.json({ ok: true });
  }
  const area = await prisma.area.create({ data: { name: body.name, description: body.description, color: body.color || "#6366f1", order: body.order || 0 } });
  return NextResponse.json(area);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const area = await prisma.area.update({ where: { id: body.id }, data: { name: body.name, description: body.description, color: body.color } });
  return NextResponse.json(area);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")!;
  await prisma.area.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
