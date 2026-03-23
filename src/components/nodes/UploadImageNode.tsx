"use client";

import { useCallback, useRef } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { ImageIcon, Upload, X } from "lucide-react";
import { UploadImageNodeData } from "@/types/workflow";
import { NodeWrapper, NodeHeader } from "./NodeWrapper";
import useWorkflowStore from "@/store/workflowStore";
import toast from "react-hot-toast";

export default function UploadImageNode({ id, data }: NodeProps) {
  const nodeData = data as UploadImageNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      const toastId = toast.loading("Uploading image...");
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "image");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await res.json();
        if (result.url) {
          updateNodeData(id, {
            imageUrl: result.url,
            fileName: file.name,
            outputs: { image_url: result.url },
          });
          toast.success("Image uploaded!", { id: toastId });
        } else {
          toast.error(result.error ?? "Upload failed", { id: toastId });
        }
      } catch {
        toast.error("Upload failed", { id: toastId });
      }
    },
    [id, updateNodeData]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file) handleUpload(file);
    },
    [handleUpload]
  );

  return (
    <NodeWrapper executionStatus={nodeData.executionStatus}>
      <NodeHeader
        icon={ImageIcon}
        iconColor="#ec4899"
        label={nodeData.label}
        executionStatus={nodeData.executionStatus}
      />

      <div className="node-body">
        {nodeData.imageUrl ? (
          <div className="relative group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={nodeData.imageUrl}
              alt="Uploaded"
              className="w-full rounded-lg object-cover"
              style={{ maxHeight: 140 }}
            />
            <button
              onClick={() =>
                updateNodeData(id, {
                  imageUrl: undefined,
                  fileName: undefined,
                  outputs: undefined,
                })
              }
              className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "rgba(0,0,0,0.7)" }}
            >
              <X size={12} className="text-white" />
            </button>
            {nodeData.fileName && (
              <p
                className="text-xs mt-1 truncate"
                style={{ color: "#8888aa" }}
              >
                {nodeData.fileName}
              </p>
            )}
          </div>
        ) : (
          <div
            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors"
            style={{ borderColor: "#2d2d44" }}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            onMouseEnter={(e) =>
              ((e.currentTarget as HTMLDivElement).style.borderColor = "#a855f7")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.borderColor = "#2d2d44")
            }
          >
            <Upload size={18} style={{ color: "#555577", margin: "0 auto 6px" }} />
            <p className="text-xs" style={{ color: "#8888aa" }}>
              Drop image or click to upload
            </p>
            <p className="text-xs mt-1" style={{ color: "#555577" }}>
              PNG, JPG, WEBP supported
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />

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
