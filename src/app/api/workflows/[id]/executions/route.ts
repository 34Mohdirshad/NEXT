import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  console.log("[EXECUTIONS_GET] Hit", { url: request.url });
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id: workflowId } = await params;

    const executions = await prisma.workflowExecution.findMany({
      where: { workflowId, userId: user.id },
      orderBy: { startedAt: "desc" },
      take: 30,
      include: {
        nodeLogs: {
          orderBy: { startedAt: "asc" },
        },
      },
    });

    return NextResponse.json(executions);
  } catch (error) {
    console.error("[EXECUTIONS_GET]", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
