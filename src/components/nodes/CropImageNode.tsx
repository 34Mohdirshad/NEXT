"use client";

import { Handle, Position, NodeProps, useEdges } from "@xyflow/react";
import { Crop } from "lucide-react";
import { CropImageNodeData } from "@/types/workflow";
import { NodeWrapper, NodeHeader } from "./NodeWrapper";
import useWorkflowStore from "@/store/workflowStore";

export default function CropImageNode({ id, data }: NodeProps) {
  const nodeData = data as CropImageNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const edges = useEdges();

  const isImageConnected = edges.some(
    (e) => e.target === id && e.targetHandle === "image_url"
  );

  const fields: {
    key: keyof CropImageNodeData;
    label: string;
    defaultVal: number;
  }[] = [
    { key: "xPercent", label: "X (%)", defaultVal: 0 },
    { key: "yPercent", label: "Y (%)", defaultVal: 0 },
    { key: "widthPercent", label: "Width (%)", defaultVal: 100 },
    { key: "heightPercent", label: "Height (%)", defaultVal: 100 },
  ];

  return (
    <NodeWrapper executionStatus={nodeData.executionStatus}>
      <NodeHeader
        icon={Crop}
        iconColor="#22c55e"
        label={nodeData.label}
        executionStatus={nodeData.executionStatus}
      />

      {/* Input handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="image_url"
        style={{ top: 48, left: -5, borderColor: "#ec4899" }}
      />

      <div className="node-body">
        {/* Image input label */}
        <div className="flex items-center gap-2 text-xs" style={{ color: "#555577", paddingLeft: 4 }}>
          <div className="w-2 h-2 rounded-full border flex-shrink-0" style={{ borderColor: "#ec4899" }} />
          <span style={{ fontSize: "10px" }}>image_url input</span>
          {isImageConnected && (
            <span className="text-xs font-medium ml-auto" style={{ color: "#ec4899" }}>●</span>
          )}
        </div>

        <div className="w-full h-px" style={{ background: "#2d2d44" }} />

        {/* Crop parameters */}
        <div className="grid grid-cols-2 gap-2">
          {fields.map(({ key, label, defaultVal }) => (
            <div key={key}>
              <p className="handle-label mb-1">{label}</p>
              <input
                type="number"
                min="0"
                max="100"
                className="node-input"
                value={(nodeData[key] as number) ?? defaultVal}
                onChange={(e) =>
                  updateNodeData(id, {
                    [key]: parseFloat(e.target.value) || 0,
                  })
                }
              />
            </div>
          ))}
        </div>

        {/* Output preview */}
        {nodeData.outputs?.image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={nodeData.outputs.image_url}
            alt="Cropped"
            className="w-full rounded-lg object-cover"
            style={{ maxHeight: 100 }}
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
