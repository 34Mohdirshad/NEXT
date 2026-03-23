"use client";

import { Handle, Position, NodeProps, useEdges } from "@xyflow/react";
import { Film } from "lucide-react";
import { ExtractFrameNodeData } from "@/types/workflow";
import { NodeWrapper, NodeHeader } from "./NodeWrapper";
import useWorkflowStore from "@/store/workflowStore";

export default function ExtractFrameNode({ id, data }: NodeProps) {
  const nodeData = data as ExtractFrameNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const edges = useEdges();

  const isVideoConnected = edges.some(
    (e) => e.target === id && e.targetHandle === "video_url"
  );

  return (
    <NodeWrapper executionStatus={nodeData.executionStatus}>
      <NodeHeader
        icon={Film}
        iconColor="#f59e0b"
        label={nodeData.label}
        executionStatus={nodeData.executionStatus}
      />

      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Left}
        id="video_url"
        style={{ top: 48, left: -5, borderColor: "#f59e0b" }}
      />

      <div className="node-body">
        {/* Video input label */}
        <div className="flex items-center gap-2 text-xs" style={{ color: "#555577", paddingLeft: 4 }}>
          <div className="w-2 h-2 rounded-full border flex-shrink-0" style={{ borderColor: "#f59e0b" }} />
          <span style={{ fontSize: "10px" }}>video_url input</span>
          {isVideoConnected && (
            <span className="text-xs font-medium ml-auto" style={{ color: "#f59e0b" }}>●</span>
          )}
        </div>

        <div className="w-full h-px" style={{ background: "#2d2d44" }} />

        {/* Timestamp */}
        <div>
          <p className="handle-label mb-1">Timestamp</p>
          <input
            type="text"
            className="node-input"
            placeholder="0 or 50% or 00:01:30"
            value={nodeData.timestamp ?? ""}
            onChange={(e) => updateNodeData(id, { timestamp: e.target.value })}
          />
          <p className="text-xs mt-1" style={{ color: "#555577" }}>
            Seconds, percentage, or HH:MM:SS
          </p>
        </div>

        {/* Output preview */}
        {nodeData.outputs?.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={nodeData.outputs.image_url}
            alt="Extracted frame"
            className="w-full rounded-lg object-cover"
            style={{ maxHeight: 120 }}
          />
        )}

        {/* Output handle */}
        <div className="relative flex items-center justify-end mt-1">
          <span className="handle-label mr-3">image url</span>
          <Handle
            type="source"
            position={Position.Right}
            id="image_url"
            style={{ right: -5 }}
          />
        </div>
      </div>
    </NodeWrapper>
  );
}
