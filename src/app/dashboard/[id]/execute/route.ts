import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { tasks } from "@trigger.dev/sdk/v3";
import { ExecutionScope } from "@/types/workflow";
import type { executeWorkflowTask } from "@/trigger/workflow";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return new NextResponse("User not found", { status: 404 });

    const { id: workflowId } = await params;
    const body = await req.json();
    
    const { nodes, edges, scope, selectedNodeIds } = body as {
      nodes: any[];
      edges: any[];
      scope: ExecutionScope;
      selectedNodeIds?: string[];
    };

    if (!nodes || !edges) {
      return new NextResponse("Nodes and edges required", { status: 400 });
    }

    // Create execution record in Prisma
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId,
        userId: user.id,
        status: "PENDING",
        scope,
        selectedNodes: selectedNodeIds || [],
      },
    });

    // Trigger background task in Trigger.dev
    const taskResult = await tasks.trigger<typeof executeWorkflowTask>("execute-workflow", {
      executionId: execution.id,
      workflowId,
      nodes,
      edges,
      scope,
      selectedNodeIds,
    });

    // We can optimistically link the run ID if possible, but Trigger v3 returns the handle 
    if (taskResult.id) {
       await prisma.workflowExecution.update({
         where: { id: execution.id },
         data: { triggerRunId: taskResult.id }
       });
    }

    return NextResponse.json({ 
      executionId: execution.id, 
      triggerRunId: taskResult.id,
      success: true 
    });
  } catch (error: any) {
    console.error("[WORKFLOW_EXECUTE]", error);
    return new NextResponse(error?.message || "Internal Error", { status: 500 });
  }
}
