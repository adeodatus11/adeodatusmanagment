import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const taskId = searchParams.get("taskId");
  const contactId = searchParams.get("contactId");
  const type = searchParams.get("type");
  const limit = searchParams.get("limit");

  const logs = await prisma.actionLog.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(taskId ? { taskId } : {}),
      ...(contactId ? { contactId } : {}),
      ...(type ? { actionType: type } : {}),
    },
    include: {
      project: { select: { name: true, area: { select: { color: true, name: true } } } },
      task: { select: { name: true } },
      contact: { select: { firstName: true, lastName: true } },
    },
    orderBy: { date: "desc" },
    ...(limit ? { take: parseInt(limit) } : {}),
  });
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const log = await prisma.actionLog.create({
    data: {
      actionType: body.actionType || "Inne",
      description: body.description,
      date: body.date ? new Date(body.date) : new Date(),
      projectId: body.projectId || null,
      taskId: body.taskId || null,
      contactId: body.contactId || null,
    },
    include: {
      project: { select: { name: true, area: { select: { color: true, name: true } } } },
      task: { select: { name: true } },
      contact: { select: { firstName: true, lastName: true } },
    },
  });
  return NextResponse.json(log);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")!;
  await prisma.actionLog.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
