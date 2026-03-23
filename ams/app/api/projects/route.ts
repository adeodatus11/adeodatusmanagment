import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const areaId = searchParams.get("areaId");
  const status = searchParams.get("status");
  
  const projects = await prisma.project.findMany({
    where: {
      ...(areaId ? { areaId } : {}),
      ...(status ? { status } : {}),
    },
    include: {
      area: { select: { name: true, color: true } },
      _count: { select: { tasks: true, logs: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const project = await prisma.project.create({
    data: {
      areaId: body.areaId,
      name: body.name,
      description: body.description,
      status: body.status || "Zaplanowane",
      priority: body.priority || "Normalny",
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      budget: body.budget,
    },
    include: { area: { select: { name: true, color: true } } },
  });
  return NextResponse.json(project);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const project = await prisma.project.update({
    where: { id: body.id },
    data: {
      name: body.name,
      description: body.description,
      status: body.status,
      priority: body.priority,
      startDate: body.startDate ? new Date(body.startDate) : undefined,
      endDate: body.endDate ? new Date(body.endDate) : undefined,
      budget: body.budget,
      areaId: body.areaId,
    },
    include: { area: { select: { name: true, color: true } } },
  });
  return NextResponse.json(project);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")!;
  await prisma.project.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
