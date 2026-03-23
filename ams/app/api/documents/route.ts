import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const projectId = searchParams.get("projectId");
  const taskId = searchParams.get("taskId");

  try {
    const documents = await prisma.document.findMany({
      where: {
        AND: [
          projectId ? { projectId } : {},
          taskId ? { taskId } : {},
        ],
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(documents);
  } catch (error) {
    console.error("GET Documents Error:", error);
    return NextResponse.json({ error: "Failed to fetch documents" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { title, urlOrPath, type, projectId, taskId } = data;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const document = await prisma.document.create({
      data: {
        title,
        urlOrPath,
        type: type || "Link",
        projectId,
        taskId,
      },
    });

    return NextResponse.json(document);
  } catch (error) {
    console.error("POST Document Error:", error);
    return NextResponse.json({ error: "Failed to create document" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  try {
    await prisma.document.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE Document Error:", error);
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
