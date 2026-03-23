import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Toggle step completion
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const step = await prisma.taskStep.update({
    where: { id: body.id },
    data: { completed: body.completed },
  });
  return NextResponse.json(step);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const step = await prisma.taskStep.create({
    data: { taskId: body.taskId, title: body.title, order: body.order || 0 },
  });
  return NextResponse.json(step);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id")!;
  await prisma.taskStep.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
