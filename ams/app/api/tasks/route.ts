import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const status = searchParams.get("status");
  const priority = searchParams.get("priority");
  const areaId = searchParams.get("areaId");

  const tasks = await prisma.task.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(status ? { status } : {}),
      ...(priority ? { priority } : {}),
      ...(areaId ? { project: { areaId } } : {}),
    },
    include: {
      project: { include: { area: { select: { name: true, color: true } } } },
      contact: { select: { firstName: true, lastName: true } },
      steps: { orderBy: { order: "asc" } },
      _count: { select: { logs: true } },
    },
    orderBy: [{ dueDate: "asc" }, { updatedAt: "desc" }],
  });
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const task = await prisma.task.create({
    data: {
      projectId: body.projectId,
      name: body.name,
      description: body.description,
      status: body.status || "W toku",
      priority: body.priority || "Normalny",
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      progress: body.progress || 0,
      contactId: body.contactId || null,
      steps: body.steps ? { create: body.steps.map((s: any, i: number) => ({ title: s.title, order: i })) } : undefined,
    },
    include: {
      project: { include: { area: { select: { name: true, color: true } } } },
      contact: { select: { firstName: true, lastName: true } },
      steps: { orderBy: { order: "asc" } },
    },
  });
  return NextResponse.json(task);
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const task = await prisma.task.update({
    where: { id: body.id },
    data: {
      name: body.name,
      description: body.description,
      status: body.status,
      priority: body.priority,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
      progress: body.progress,
      contactId: body.contactId || null,
      projectId: body.projectId,
    },
    include: {
      project: { include: { area: { select: { name: true, color: true } } } },
      contact: { select: { firstName: true, lastName: true } },
      steps: { orderBy: { order: "asc" } },
    },
  });
  return NextResponse.json(task);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")!;
  await prisma.task.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
