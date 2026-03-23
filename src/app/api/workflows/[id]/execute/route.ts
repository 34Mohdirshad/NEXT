import { NextResponse, NextRequest } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { buildDAG } from "@/lib/dag";
import { ExecutionStatus } from "@/types/workflow";

const executeSchema = z.object({
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  scope: z.enum(["FULL_WORKFLOW", "SELECTED_NODES", "SINGLE_NODE"]),
  selectedNodeIds: z.array(z.string()).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { clerkId: userId } });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const { id: workflowId } = await params;
    const body = await request.json();
    const parsed = executeSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }

    const { nodes, edges, scope, selectedNodeIds } = parsed.data;

    // Create execution record
    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId,
        userId: user.id,
        status: "RUNNING",
        scope,
        selectedNodes: selectedNodeIds || [],
      },
    });

    const startedAt = Date.now();

    // Determine which nodes to run
    let targetNodes = nodes;
    let targetEdges = edges;
    if (scope !== "FULL_WORKFLOW" && selectedNodeIds?.length) {
      const ids = new Set(selectedNodeIds);
      targetNodes = nodes.filter((n: any) => ids.has(n.id));
      targetEdges = edges.filter((e: any) => ids.has(e.source) && ids.has(e.target));
    }

    // Build D.A.G. execution plan
    let executionPlan;
    try {
      executionPlan = buildDAG(targetNodes, targetEdges);
    } catch (e: any) {
      await prisma.workflowExecution.update({
        where: { id: execution.id },
        data: { status: "FAILED", error: e.message, completedAt: new Date(), duration: 0 },
      });
      return NextResponse.json({ error: e.message }, { status: 422 });
    }

    // Execute layer by layer (parallel within each layer)
    const outputsByNode: Record<string, Record<string, any>> = {};
    const nodeResults: { nodeId: string; status: ExecutionStatus; outputs?: any; error?: string }[] = [];
    let anyFailed = false;

    for (const layer of executionPlan.layers) {
      await Promise.all(
        layer.map(async (nodeId: string) => {
          const node = executionPlan.nodeMap.get(nodeId);
          if (!node) return;

          const nodeStart = Date.now();

          // Gather inputs from connected edge outputs
          const nodeInputs: Record<string, any> = {};
          const incoming = edges.filter((e: any) => e.target === nodeId);
          for (const edge of incoming) {
            const srcOut = outputsByNode[edge.source];
            if (srcOut && edge.sourceHandle && srcOut[edge.sourceHandle]) {
              if (edge.targetHandle) {
                nodeInputs[edge.targetHandle] = srcOut[edge.sourceHandle];
              }
            }
          }

          // Fill static fallbacks for LLM
          if (!nodeInputs.system_prompt && node.data.systemPrompt) nodeInputs.system_prompt = node.data.systemPrompt;
          if (!nodeInputs.user_message && node.data.userMessage) nodeInputs.user_message = node.data.userMessage;

          // Create node log
          const log = await prisma.nodeExecutionLog.create({
            data: {
              executionId: execution.id,
              nodeId,
              nodeType: node.type,
              nodeLabel: (node.data.label as string) ?? nodeId,
              status: "RUNNING",
              inputs: nodeInputs,
            },
          });

          let nodeStatus: ExecutionStatus = "SUCCESS";
          let nodeOutputs: Record<string, any> = {};
          let nodeError: string | null = null;

          try {
            nodeOutputs = await executeNode(node.type, node.data as Record<string, any>, nodeInputs);
            outputsByNode[nodeId] = nodeOutputs;
          } catch (err: any) {
            nodeStatus = "FAILED";
            nodeError = err?.message?.substring(0, 500) ?? "Unknown error";
            anyFailed = true;
          }

          const dur = Date.now() - nodeStart;
          await prisma.nodeExecutionLog.update({
            where: { id: log.id },
            data: {
              status: nodeStatus,
              outputs: nodeOutputs,
              error: nodeError,
              completedAt: new Date(),
              duration: dur,
            },
          });

          nodeResults.push({ nodeId, status: nodeStatus, outputs: nodeOutputs, error: nodeError ?? undefined });
        })
      );
    }

    const finalStatus: ExecutionStatus = anyFailed ? "PARTIAL" : "SUCCESS";
    const totalDuration = Date.now() - startedAt;

    await prisma.workflowExecution.update({
      where: { id: execution.id },
      data: {
        status: finalStatus,
        completedAt: new Date(),
        duration: totalDuration,
      },
    });

    return NextResponse.json({
      executionId: execution.id,
      status: finalStatus,
      duration: totalDuration,
      nodeResults,
    });
  } catch (error: any) {
    console.error("[WORKFLOW_EXECUTE]", error);
    return NextResponse.json({ error: error?.message || "Internal Error" }, { status: 500 });
  }
}

// ─── Node Execution Logic ─────────────────────────────────────────────────────
async function executeNode(
  type: string,
  data: Record<string, any>,
  inputs: Record<string, any>
): Promise<Record<string, any>> {
  switch (type) {
    case "text":
      return { text: data.text || "" };

    case "uploadImage":
      return { image_url: data.imageUrl || (data.outputs as any)?.image_url || "" };

    case "uploadVideo":
      return { video_url: data.videoUrl || (data.outputs as any)?.video_url || "" };

    case "cropImage": {
      await new Promise((r) => setTimeout(r, 800));
      return { image_url: inputs.image_url || (data.outputs as any)?.image_url || "" };
    }

    case "extractFrame": {
      await new Promise((r) => setTimeout(r, 800));
      return { image_url: inputs.video_url || (data.outputs as any)?.image_url || "" };
    }

    case "llm":
      return await executeLLM(inputs, data);

    default:
      throw new Error(`Unknown node type: ${type}`);
  }
}

async function executeLLM(
  inputs: Record<string, any>,
  data: Record<string, any>
): Promise<Record<string, any>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "your_gemini_api_key") {
    const msg = inputs.user_message || data.userMessage || "No message";
    return {
      text: `[Demo] AI response for: "${String(msg).slice(0, 80)}"`,
    };
  }

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }, { apiVersion: "v1" });

  const systemPrompt = inputs.system_prompt || data.systemPrompt || "";
  const userMessage = inputs.user_message || data.userMessage || "";

  const promptParts: any[] = [];
  if (systemPrompt) promptParts.push(`System Instructions:\n${systemPrompt}\n\n---\n`);
  promptParts.push(userMessage || "No message provided.");

  // Attach images if provided
  const imageUrls = [inputs.image_input_1, inputs.image_input_2, inputs.image_input_3].filter(Boolean);
  for (const url of imageUrls) {
    try {
      if (typeof url !== "string") continue;
      if (url.startsWith("data:")) {
        const [header, b64] = url.split(",");
        const mimeType = header.split(":")[1].split(";")[0];
        promptParts.push({ inlineData: { data: b64, mimeType } });
      } else if (url.startsWith("http")) {
        const resp = await fetch(url);
        const buf = await resp.arrayBuffer();
        const b64 = Buffer.from(buf).toString("base64");
        const mime = resp.headers.get("content-type") || "image/jpeg";
        promptParts.push({ inlineData: { data: b64, mimeType: mime } });
      }
    } catch {
      // skip failed image
    }
  }

  const result = await model.generateContent(promptParts);
  return { text: result.response.text() };
}
