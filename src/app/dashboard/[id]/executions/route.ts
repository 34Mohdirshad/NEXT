import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    const { id: workflowId } = await params;

    const executions = await prisma.workflowExecution.findMany({
      where: {
        workflowId,
        userId: user.id,
      },
      orderBy: {
        startedAt: "desc",
      },
      include: {
        nodeLogs: {
          orderBy: {
            startedAt: "asc",
          },
        },
      },
      take: 20, // Limit to recent 20 for perf
    });

    return NextResponse.json(executions);
  } catch (error) {
    console.error("[EXECUTIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
