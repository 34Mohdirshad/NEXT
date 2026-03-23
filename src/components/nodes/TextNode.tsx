"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { Type } from "lucide-react";
import { TextNodeData } from "@/types/workflow";
import { NodeWrapper, NodeHeader } from "./NodeWrapper";
import useWorkflowStore from "@/store/workflowStore";

export default function TextNode({ id, data }: NodeProps) {
  const nodeData = data as TextNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);

  return (
    <NodeWrapper executionStatus={nodeData.executionStatus}>
      <NodeHeader
        icon={Type}
        iconColor="#3b82f6"
        label={nodeData.label}
        executionStatus={nodeData.executionStatus}
      />

      <div className="node-body">
        <div>
          <p className="handle-label mb-1">Text Content</p>
          <textarea
            className="node-input"
            rows={4}
            placeholder="Enter text content..."
            value={nodeData.text}
            onChange={(e) =>
              updateNodeData(id, { text: e.target.value })
            }
          />
        </div>

        {/* Output handle */}
        <div className="relative flex items-center justify-end">
          <span className="handle-label mr-3">text out</span>
          <Handle
            type="source"
            position={Position.Right}
            id="text"
            style={{ right: -5 }}
          />
        </div>

        {/* Output preview */}
        {nodeData.outputs?.text && (
          <div
            className="text-xs rounded-lg p-2 border"
            style={{
              background: "#1a1a2e",
              borderColor: "#2d2d44",
              color: "#8888aa",
              maxHeight: 60,
              overflow: "hidden",
            }}
          >
            {nodeData.outputs.text.slice(0, 120)}...
          </div>
        )}
      </div>
    </NodeWrapper>
  );
}
