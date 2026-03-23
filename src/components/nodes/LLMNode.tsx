"use client";

import { Handle, Position, NodeProps, useEdges } from "@xyflow/react";
import { Cpu, Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { LLMNodeData } from "@/types/workflow";
import { NodeWrapper, NodeHeader } from "./NodeWrapper";
import useWorkflowStore from "@/store/workflowStore";
import { useState } from "react";

export default function LLMNode({ id, data }: NodeProps) {
  const nodeData = data as LLMNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const edges = useEdges();
  const [expanded, setExpanded] = useState(false);

  // Check which handles are connected
  const connectedHandles = new Set(
    edges
      .filter((e) => e.target === id)
      .map((e) => e.targetHandle)
  );

  const isSystemPromptConnected = connectedHandles.has("system_prompt");
  const isUserMessageConnected = connectedHandles.has("user_message");

  const inputHandles: { id: string; label: string; color: string }[] = [
    { id: "system_prompt", label: "System Prompt", color: "#8b5cf6" },
    { id: "user_message", label: "User Message", color: "#a855f7" },
    { id: "image_input_1", label: "Image 1", color: "#ec4899" },
    { id: "image_input_2", label: "Image 2", color: "#ec4899" },
    { id: "image_input_3", label: "Image 3", color: "#ec4899" },
  ];

  const handlePositions: Record<string, number> = {
    system_prompt: 50,
    user_message: 90,
    image_input_1: 130,
    image_input_2: 170,
    image_input_3: 210,
  };

  return (
    <NodeWrapper executionStatus={nodeData.executionStatus}>
      <NodeHeader
        icon={Cpu}
        iconColor="#a855f7"
        label={nodeData.label}
        executionStatus={nodeData.executionStatus}
      />

      {/* Input handles (positioned along the left side) */}
      {inputHandles.map((h) => (
        <Handle
          key={h.id}
          type="target"
          position={Position.Left}
          id={h.id}
          style={{
            top: handlePositions[h.id],
            left: -5,
            borderColor: h.color,
          }}
        />
      ))}

      <div className="node-body">
        {/* Handle labels */}
        <div className="flex flex-col gap-1">
          {inputHandles.map((h) => (
            <div
              key={h.id}
              className="flex items-center gap-2 text-xs"
              style={{ color: "#555577", paddingLeft: 4 }}
            >
              <div
                className="w-2 h-2 rounded-full border flex-shrink-0"
                style={{ borderColor: h.color }}
              />
              <span style={{ fontSize: "10px" }}>{h.label}</span>
              {connectedHandles.has(h.id) && (
                <span
                  className="text-xs font-medium"
                  style={{ color: h.color, marginLeft: "auto" }}
                >
                  ●
                </span>
              )}
            </div>
          ))}
        </div>

        <div
          className="w-full h-px"
          style={{ background: "#2d2d44" }}
        />

        {/* System Prompt (disabled if connected) */}
        <div>
          <p className="handle-label mb-1">System Prompt</p>
          <textarea
            className="node-input"
            rows={2}
            placeholder="You are a helpful assistant..."
            value={nodeData.systemPrompt ?? ""}
            disabled={isSystemPromptConnected}
            onChange={(e) =>
              updateNodeData(id, { systemPrompt: e.target.value })
            }
          />
        </div>

        {/* User Message (disabled if connected) */}
        <div>
          <p className="handle-label mb-1">User Message</p>
          <textarea
            className="node-input"
            rows={2}
            placeholder="What would you like to ask?"
            value={nodeData.userMessage ?? ""}
            disabled={isUserMessageConnected}
            onChange={(e) =>
              updateNodeData(id, { userMessage: e.target.value })
            }
          />
        </div>

        {/* Loading state */}
        {nodeData.isLoading && (
          <div className="flex items-center gap-2 justify-center py-2">
            <Loader2 size={14} className="text-purple-400 animate-spin" />
            <span className="text-xs" style={{ color: "#a855f7" }}>
              Generating...
            </span>
          </div>
        )}

        {/* Generated output */}
        {nodeData.generatedOutput && (
          <div>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center justify-between w-full text-xs font-medium mb-1"
              style={{ color: "#c084fc" }}
            >
              <span>Generated Output</span>
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>
            {expanded && (
              <div
                className="text-xs rounded-lg p-2 border"
                style={{
                  background: "#1a1a2e",
                  borderColor: "#3d2d5e",
                  color: "#e0e0ff",
                  whiteSpace: "pre-wrap",
                  maxHeight: 120,
                  overflowY: "auto",
                  lineHeight: 1.5,
                }}
              >
                {nodeData.generatedOutput}
              </div>
            )}
          </div>
        )}

        {/* Output handle */}
        <div className="relative flex items-center justify-end mt-1">
          <span className="handle-label mr-3">text out</span>
          <Handle
            type="source"
            position={Position.Right}
            id="text"
            style={{ right: -5 }}
          />
        </div>
      </div>
    </NodeWrapper>
  );
}
