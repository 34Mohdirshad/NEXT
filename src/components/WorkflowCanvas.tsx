"use client";

import { useCallback, useRef } from "react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  SelectionMode,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import useWorkflowStore from "@/store/workflowStore";
import TextNode from "@/components/nodes/TextNode";
import UploadImageNode from "@/components/nodes/UploadImageNode";
import UploadVideoNode from "@/components/nodes/UploadVideoNode";
import LLMNode from "@/components/nodes/LLMNode";
import CropImageNode from "@/components/nodes/CropImageNode";
import ExtractFrameNode from "@/components/nodes/ExtractFrameNode";
import { NodeType } from "@/types/workflow";
import { generateId } from "@/lib/utils";
import { MarkerType } from "@xyflow/react";

const nodeTypes = {
  text: TextNode,
  uploadImage: UploadImageNode,
  uploadVideo: UploadVideoNode,
  llm: LLMNode,
  cropImage: CropImageNode,
  extractFrame: ExtractFrameNode,
};

const NODE_DEFAULTS: Record<NodeType, object> = {
  text: { label: "Text Node", text: "" },
  uploadImage: { label: "Upload Image", imageUrl: undefined },
  uploadVideo: { label: "Upload Video", videoUrl: undefined },
  llm: { label: "LLM Node", systemPrompt: "", userMessage: "" },
  cropImage: { label: "Crop Image", xPercent: 0, yPercent: 0, widthPercent: 100, heightPercent: 100 },
  extractFrame: { label: "Extract Frame", timestamp: "0" },
};

interface WorkflowCanvasProps {
  draggingNodeType: NodeType | null;
  onDragEnd: () => void;
}

export default function WorkflowCanvas({ draggingNodeType, onDragEnd }: WorkflowCanvasProps) {
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    setSelectedNodes,
  } = useWorkflowStore();

  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  const { screenToFlowPosition } = useReactFlow();

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      if (!draggingNodeType) return;

      const position = screenToFlowPosition({
        x: e.clientX,
        y: e.clientY,
      });

      addNode(draggingNodeType, position);
      onDragEnd();
    },
    [draggingNodeType, screenToFlowPosition, addNode, onDragEnd]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: { id: string }[] }) => {
      setSelectedNodes(selectedNodes.map((n) => n.id));
    },
    [setSelectedNodes]
  );

  return (
    <div ref={reactFlowWrapper} className="flex-1 relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onSelectionChange={handleSelectionChange}
        nodeTypes={nodeTypes}
        defaultEdgeOptions={{
          type: "smoothstep",
          animated: true,
          style: { stroke: "#a855f7", strokeWidth: 2 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#a855f7",
          },
        }}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        selectionMode={SelectionMode.Partial}
        multiSelectionKeyCode="Shift"
        deleteKeyCode="Delete"
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={24}
          size={1}
          color="#1e1e30"
        />
        <Controls
          showInteractive={false}
          style={{
            bottom: 20,
            left: 20,
          }}
        />
        <MiniMap
          style={{
            bottom: 20,
            right: 20,
          }}
          nodeColor="#a855f7"
          maskColor="rgba(10, 10, 15, 0.7)"
        />
      </ReactFlow>

      {/* Empty state overlay */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 border"
              style={{
                background: "rgba(168, 85, 247, 0.1)",
                borderColor: "rgba(168, 85, 247, 0.2)",
              }}
            >
              <svg
                width="28"
                height="28"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#a855f7"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="12" r="3" />
                <circle cx="4" cy="6" r="2" />
                <circle cx="20" cy="6" r="2" />
                <circle cx="4" cy="18" r="2" />
                <circle cx="20" cy="18" r="2" />
                <line x1="6" y1="6" x2="10" y2="11" />
                <line x1="18" y1="6" x2="14" y2="11" />
                <line x1="12" y1="15" x2="5" y2="17" />
                <line x1="12" y1="15" x2="19" y2="17" />
              </svg>
            </div>
            <h3 className="font-medium text-white mb-1">Empty Canvas</h3>
            <p className="text-sm" style={{ color: "#555577" }}>
              Drag nodes from the left sidebar or click to add them
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
