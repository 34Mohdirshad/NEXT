import { Node, Edge } from "@xyflow/react";

// ─── Node Types ───────────────────────────────────────────────────────────────
export type NodeType =
  | "text"
  | "uploadImage"
  | "uploadVideo"
  | "llm"
  | "cropImage"
  | "extractFrame";

// ─── Node Data ────────────────────────────────────────────────────────────────
export interface TextNodeData extends Record<string, unknown> {
  label: string;
  text: string;
  outputs?: { text?: string };
  executionStatus?: ExecutionStatus;
}

export interface UploadImageNodeData extends Record<string, unknown> {
  label: string;
  imageUrl?: string;
  fileName?: string;
  outputs?: { image_url?: string };
  executionStatus?: ExecutionStatus;
}

export interface UploadVideoNodeData extends Record<string, unknown> {
  label: string;
  videoUrl?: string;
  fileName?: string;
  outputs?: { video_url?: string };
  executionStatus?: ExecutionStatus;
}

export interface LLMNodeData extends Record<string, unknown> {
  label: string;
  systemPrompt?: string;
  userMessage?: string;
  generatedOutput?: string;
  isLoading?: boolean;
  outputs?: { text?: string };
  executionStatus?: ExecutionStatus;
}

export interface CropImageNodeData extends Record<string, unknown> {
  label: string;
  xPercent?: number;
  yPercent?: number;
  widthPercent?: number;
  heightPercent?: number;
  outputs?: { image_url?: string };
  executionStatus?: ExecutionStatus;
}

export interface ExtractFrameNodeData extends Record<string, unknown> {
  label: string;
  timestamp?: string;
  outputs?: { image_url?: string };
  executionStatus?: ExecutionStatus;
}

export type AnyNodeData =
  | TextNodeData
  | UploadImageNodeData
  | UploadVideoNodeData
  | LLMNodeData
  | CropImageNodeData
  | ExtractFrameNodeData;

export type WorkflowNode = Node<AnyNodeData, NodeType>;
export type WorkflowEdge = Edge;

// ─── Workflow Definition ───────────────────────────────────────────────────────
export interface WorkflowDefinition {
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  viewport?: { x: number; y: number; zoom: number };
}

// ─── Execution Types ───────────────────────────────────────────────────────────
export type ExecutionStatus =
  | "PENDING"
  | "RUNNING"
  | "SUCCESS"
  | "FAILED"
  | "PARTIAL"
  | "SKIPPED";

export type ExecutionScope =
  | "FULL_WORKFLOW"
  | "SELECTED_NODES"
  | "SINGLE_NODE";

export interface NodeExecutionLog {
  id: string;
  executionId: string;
  nodeId: string;
  nodeType: string;
  nodeLabel?: string | null;
  status: ExecutionStatus;
  inputs?: Record<string, unknown> | null;
  outputs?: Record<string, unknown> | null;
  error?: string | null;
  startedAt: Date;
  completedAt?: Date | null;
  duration?: number | null;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  userId: string;
  status: ExecutionStatus;
  scope: ExecutionScope;
  selectedNodes: string[];
  startedAt: Date;
  completedAt?: Date | null;
  duration?: number | null;
  error?: string | null;
  triggerRunId?: string | null;
  nodeLogs: NodeExecutionLog[];
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  definition: WorkflowDefinition;
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
  executions?: WorkflowExecution[];
}

// ─── Node Handle Types ─────────────────────────────────────────────────────────
export type HandleId =
  | "text"
  | "image_url"
  | "video_url"
  | "system_prompt"
  | "user_message"
  | "image_input_1"
  | "image_input_2"
  | "image_input_3";

// ─── DAG Execution ─────────────────────────────────────────────────────────────
export interface DAGNode {
  id: string;
  type: NodeType;
  data: AnyNodeData;
  dependencies: string[];
  dependents: string[];
}

export interface ExecutionPlan {
  layers: string[][];
  nodeMap: Map<string, DAGNode>;
}
