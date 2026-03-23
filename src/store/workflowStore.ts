"use client";

import { create } from "zustand";
import { temporal } from "zundo";
import {
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  Connection,
  NodeChange,
  EdgeChange,
  MarkerType,
} from "@xyflow/react";
import {
  WorkflowNode,
  WorkflowEdge,
  AnyNodeData,
  NodeType,
  ExecutionStatus,
} from "@/types/workflow";
import { generateId } from "@/lib/utils";
import { validateDAG } from "@/lib/dag";

interface WorkflowStore {
  // Workflow meta
  workflowId: string | null;
  workflowName: string;
  workflowDescription: string;
  isSaving: boolean;
  isExecuting: boolean;
  executionId: string | null;

  // Canvas state
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  selectedNodes: string[];

  // Actions
  setWorkflowId: (id: string | null) => void;
  setWorkflowName: (name: string) => void;
  setWorkflowDescription: (desc: string) => void;
  setIsSaving: (saving: boolean) => void;
  setIsExecuting: (executing: boolean) => void;
  setExecutionId: (id: string | null) => void;

  // Node/Edge operations
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (type: NodeType, position?: { x: number; y: number }) => void;
  updateNodeData: (nodeId: string, data: Partial<AnyNodeData>) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;

  // Selection
  setSelectedNodes: (ids: string[]) => void;
  selectAllNodes: () => void;
  clearSelection: () => void;

  // Status updates (for live execution)
  updateNodeStatus: (nodeId: string, status: ExecutionStatus) => void;
  clearAllNodeStatuses: () => void;

  // Import/Export
  exportWorkflow: () => string;
  importWorkflow: (json: string) => void;
  clearWorkflow: () => void;
}

const NODE_DEFAULTS: Record<NodeType, { label: string; data: AnyNodeData }> = {
  text: {
    label: "Text Node",
    data: { label: "Text Node", text: "" },
  },
  uploadImage: {
    label: "Upload Image",
    data: { label: "Upload Image", imageUrl: undefined },
  },
  uploadVideo: {
    label: "Upload Video",
    data: { label: "Upload Video", videoUrl: undefined },
  },
  llm: {
    label: "LLM Node",
    data: { label: "LLM Node", systemPrompt: "", userMessage: "" },
  },
  cropImage: {
    label: "Crop Image",
    data: {
      label: "Crop Image",
      xPercent: 0,
      yPercent: 0,
      widthPercent: 100,
      heightPercent: 100,
    },
  },
  extractFrame: {
    label: "Extract Frame",
    data: { label: "Extract Frame", timestamp: "0" },
  },
};

const useWorkflowStore = create<WorkflowStore>()(
  temporal(
    (set, get) => ({
      // Workflow meta
      workflowId: null,
      workflowName: "Untitled Workflow",
      workflowDescription: "",
      isSaving: false,
      isExecuting: false,
      executionId: null,

      // Canvas
      nodes: [],
      edges: [],
      selectedNodes: [],

      // Setters
      setWorkflowId: (id) => set({ workflowId: id }),
      setWorkflowName: (name) => set({ workflowName: name }),
      setWorkflowDescription: (desc) => set({ workflowDescription: desc }),
      setIsSaving: (saving) => set({ isSaving: saving }),
      setIsExecuting: (executing) => set({ isExecuting: executing }),
      setExecutionId: (id) => set({ executionId: id }),

      // Node/Edge operations
      setNodes: (nodes) => set({ nodes }),
      setEdges: (edges) => set({ edges }),

      onNodesChange: (changes) =>
        set((state) => ({
          nodes: applyNodeChanges(changes, state.nodes) as WorkflowNode[],
        })),

      onEdgesChange: (changes) =>
        set((state) => ({
          edges: applyEdgeChanges(changes, state.edges),
        })),

      onConnect: (connection) => {
        const { nodes, edges } = get();

        // Build prospective edge list to validate
        const newEdge: WorkflowEdge = {
          ...connection,
          id: `edge-${generateId()}`,
          type: "smoothstep",
          animated: true,
          style: { stroke: "#a855f7", strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#a855f7",
          },
          source: connection.source!,
          target: connection.target!,
        };

        const prospectiveEdges = [...edges, newEdge];
        const { valid, error } = validateDAG(nodes, prospectiveEdges);

        if (!valid) {
          console.warn("Connection rejected:", error);
          return;
        }

        set((state) => ({
          edges: addEdge(newEdge, state.edges),
        }));
      },

      addNode: (type, position) => {
        const defaults = NODE_DEFAULTS[type];
        const id = `node-${generateId()}`;
        const newNode: WorkflowNode = {
          id,
          type,
          position: position ?? {
            x: 200 + Math.random() * 300,
            y: 100 + Math.random() * 300,
          },
          data: { ...defaults.data },
        };

        set((state) => ({
          nodes: [...state.nodes, newNode],
        }));
      },

      updateNodeData: (nodeId, data) =>
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId ? { ...n, data: { ...n.data, ...data } as AnyNodeData } : n
          ),
        })),

      deleteNode: (nodeId) =>
        set((state) => ({
          nodes: state.nodes.filter((n) => n.id !== nodeId),
          edges: state.edges.filter(
            (e) => e.source !== nodeId && e.target !== nodeId
          ),
        })),

      duplicateNode: (nodeId) => {
        const { nodes } = get();
        const node = nodes.find((n) => n.id === nodeId);
        if (!node) return;
        const id = `node-${generateId()}`;
        const newNode: WorkflowNode = {
          ...node,
          id,
          position: { x: node.position.x + 40, y: node.position.y + 40 },
          data: { ...node.data },
        };
        set((state) => ({ nodes: [...state.nodes, newNode] }));
      },

      // Selection
      setSelectedNodes: (ids) => set({ selectedNodes: ids }),
      selectAllNodes: () =>
        set((state) => ({ selectedNodes: state.nodes.map((n) => n.id) })),
      clearSelection: () => set({ selectedNodes: [] }),

      // Status
      updateNodeStatus: (nodeId, status) =>
        set((state) => ({
          nodes: state.nodes.map((n) =>
            n.id === nodeId
              ? { ...n, data: { ...n.data, executionStatus: status } }
              : n
          ),
        })),

      clearAllNodeStatuses: () =>
        set((state) => ({
          nodes: state.nodes.map((n) => ({
            ...n,
            data: { ...n.data, executionStatus: undefined, isLoading: false },
          })),
        })),

      // Import/Export
      exportWorkflow: () => {
        const { nodes, edges, workflowName, workflowDescription } = get();
        return JSON.stringify(
          { nodes, edges, workflowName, workflowDescription },
          null,
          2
        );
      },

      importWorkflow: (json) => {
        try {
          const data = JSON.parse(json);
          set({
            nodes: data.nodes ?? [],
            edges: data.edges ?? [],
            workflowName: data.workflowName ?? "Imported Workflow",
            workflowDescription: data.workflowDescription ?? "",
          });
        } catch (e) {
          console.error("Failed to import workflow:", e);
        }
      },

      clearWorkflow: () =>
        set({
          nodes: [],
          edges: [],
          workflowId: null,
          workflowName: "Untitled Workflow",
          workflowDescription: "",
          executionId: null,
        }),
    }),
    {
      // Only track nodes and edges in undo/redo history
      partialize: (state) => ({
        nodes: state.nodes,
        edges: state.edges,
      }),
    }
  )
);

export default useWorkflowStore;
