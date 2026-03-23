import { schemaTask, logger } from "@trigger.dev/sdk/v3";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { generateId } from "@/lib/utils";
import { buildDAG } from "@/lib/dag";
import { ExecutionStatus, NodeType, DAGNode, ExecutionPlan } from "@/types/workflow";
import { GoogleGenerativeAI } from "@google/generative-ai";
// In real use, use an FFmpeg service or wrapper. For here, since we mock FFmpeg, we can just return a placeholder or call transloadit
// To implement standard Trigger.dev background logic:

export const executeWorkflowTask = schemaTask({
  id: "execute-workflow",
  maxDuration: 300,
  schema: z.object({
    executionId: z.string(),
    workflowId: z.string(),
    nodes: z.array(z.any()), // array of WorkflowNode
    edges: z.array(z.any()), // array of WorkflowEdge
    scope: z.enum(["FULL_WORKFLOW", "SELECTED_NODES", "SINGLE_NODE"]),
    selectedNodeIds: z.array(z.string()).optional(),
  }),
  run: async (payload, { ctx }) => {
    logger.info("Starting workflow execution", { executionId: payload.executionId });
    const { executionId, nodes, edges, scope, selectedNodeIds } = payload;

    try {
      // 1. Mark execution as RUNNING and save triggerRunId
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: "RUNNING",
          triggerRunId: ctx.run.id,
        },
      });

      // 2. Build DAG
      let executionPlan: ExecutionPlan;
      try {
        if (scope === "FULL_WORKFLOW") {
          executionPlan = buildDAG(nodes, edges);
        } else {
          // Simplistic partial plan
          const targetIds = new Set(selectedNodeIds || []);
          const filteredNodes = nodes.filter(n => targetIds.has(n.id));
          const filteredEdges = edges.filter(e => targetIds.has(e.source) && targetIds.has(e.target));
          executionPlan = buildDAG(filteredNodes, filteredEdges);
        }
      } catch (err) {
        throw new Error(`DAG Error: ${(err as Error).message}`);
      }

      // Store outputs universally so downstream nodes can read them
      // Format: { [nodeId]: { [outputHandle]: value } }
      const outputsByNode: Record<string, Record<string, any>> = {};

      // 3. Execute layer by layer sequentially (nodes within a layer run in parallel)
      for (const layer of executionPlan.layers) {
        logger.info(`Executing layer`, { layer });
        
        await Promise.all(
          layer.map(async (nodeId: string) => {
            const node = executionPlan.nodeMap.get(nodeId);
            if (!node) return;

            const startTime = Date.now();
            let nodeStatus: ExecutionStatus = "RUNNING";
            let nodeOutputs: Record<string, any> = {};
            let nodeError: string | null = null;
            let nodeInputs: Record<string, any> = {};

            // Collect inputs from dependencies
            const incomingEdges = edges.filter(e => e.target === nodeId);
            for (const edge of incomingEdges) {
              const sourceOutputs = outputsByNode[edge.source];
              if (sourceOutputs && sourceOutputs[edge.sourceHandle]) {
                nodeInputs[edge.targetHandle] = sourceOutputs[edge.sourceHandle];
              }
            }

            // Merge dynamic inputs with node's static data
            const mergedInputs = { ...nodeInputs };
            // For LLM, if system_prompt is dynamically connected, use it; else fallback to static data
            if (!mergedInputs.system_prompt && node.data.systemPrompt) {
              mergedInputs.system_prompt = node.data.systemPrompt;
            }
            if (!mergedInputs.user_message && node.data.userMessage) {
              mergedInputs.user_message = node.data.userMessage;
            }

            // Create node log entry
            let logId;
            try {
               const log = await prisma.nodeExecutionLog.create({
                data: {
                  executionId,
                  nodeId: node.id,
                  nodeType: node.type,
                  nodeLabel: node.data.label,
                  status: "RUNNING",
                  inputs: mergedInputs,
                },
              });
              logId = log.id;
            } catch (err) {
              logger.error("Failed to create node log", { err });
            }

            try {
              // EXECUTE NODE LOGIC
              nodeOutputs = await executeNodeLogic(node, mergedInputs);
              nodeStatus = "SUCCESS";
              outputsByNode[node.id] = nodeOutputs;
            } catch (error: any) {
              logger.error(`Node ${node.id} failed`, { error });
              nodeStatus = "FAILED";
              nodeError = error.message.substring(0, 1000);
            }

             // Update node log entry
            if (logId) {
              const endTime = Date.now();
              await prisma.nodeExecutionLog.update({
                 where: { id: logId },
                 data: {
                   status: nodeStatus,
                   outputs: nodeOutputs,
                   error: nodeError,
                   completedAt: new Date(endTime),
                   duration: endTime - startTime,
                 }
              });
            }

            if (nodeStatus === "FAILED") {
              throw new Error(`Node ${node.id} failed: ${nodeError}`);
            }
          })
        );
      }

      // 4. Mark execution as SUCCESS
      const endTime = Date.now();
      const exec = await prisma.workflowExecution.findUnique({
        where: { id: executionId },
      });
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: "SUCCESS",
          completedAt: new Date(endTime),
          duration: endTime - (exec?.startedAt.getTime() || endTime),
        },
      });

      return { success: true };
    } catch (error: any) {
      logger.error("Workflow execution failed", { error });
      
      const endTime = Date.now();
      const exec = await prisma.workflowExecution.findUnique({
        where: { id: executionId },
      });

      if (exec) {
         await prisma.workflowExecution.update({
          where: { id: executionId },
          data: {
            status: "FAILED",
            error: error.message.substring(0, 500),
            completedAt: new Date(endTime),
            duration: endTime - exec.startedAt.getTime(),
          },
        });
      }

      throw error;
    }
  },
});

async function executeNodeLogic(node: DAGNode, inputs: Record<string, any>): Promise<Record<string, any>> {
  switch (node.type) {
    case "text":
      return { text: node.data.text || "" };
      
    case "uploadImage":
      return { image_url: node.data.imageUrl || "" };
      
    case "uploadVideo":
      return { video_url: node.data.videoUrl || "" };
      
    case "cropImage":
      // In a real app, we would make an API call to FFmpeg processing / Transloadit here
      // For this demo, we mock it via a 2s delay
      await new Promise(r => setTimeout(r, 2000));
      return { image_url: inputs.image_url || "" }; // Pass-through for demo
      
    case "extractFrame":
      await new Promise(r => setTimeout(r, 2000));
      return { image_url: inputs.video_url || "" }; // Mock pass-through video->image
      
    case "llm":
      return await executeLLM(inputs);
      
    default:
      throw new Error(`Unsupported node type: ${node.type}`);
  }
}

async function executeLLM(inputs: Record<string, any>): Promise<Record<string, any>> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY is not defined");

  // Format multimodal inputs for Gemini
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash-latest" }); // Use stable alias for flash
  
  const systemPrompt = inputs.system_prompt || "";
  const userMessage = inputs.user_message || "";
  
  // Aggregate images
  const images: string[] = [];
  if (inputs.image_input_1) images.push(inputs.image_input_1);
  if (inputs.image_input_2) images.push(inputs.image_input_2);
  if (inputs.image_input_3) images.push(inputs.image_input_3);

  const promptSegments: any[] = [];
  
  if (systemPrompt) promptSegments.push(`System Instructions: ${systemPrompt}\n---\n`);
  promptSegments.push(userMessage);

  // If there are image URLs, fetch and convert to base64 for Gemini (Basic demo logic)
  // Warning: in production consider caching, size limits, and accurate MIME types
  for (const url of images) {
    try {
      if (!url.startsWith("http")) continue;
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      const base64 = Buffer.from(buffer).toString("base64");
      const mimeType = response.headers.get("content-type") || "image/jpeg";
      
      promptSegments.push({
        inlineData: {
          data: base64,
          mimeType
        }
      });
    } catch (e) {
      logger.warn(`Failed to process image url for LLM: ${url}`);
    }
  }

  const result = await model.generateContent(promptSegments);
  const text = result.response.text();

  return { text };
}
