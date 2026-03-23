"use client";

import { useCallback, useRef } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Video, Upload, X } from "lucide-react";
import { UploadVideoNodeData } from "@/types/workflow";
import { NodeWrapper, NodeHeader } from "./NodeWrapper";
import useWorkflowStore from "@/store/workflowStore";
import toast from "react-hot-toast";

export default function UploadVideoNode({ id, data }: NodeProps) {
  const nodeData = data as UploadVideoNodeData;
  const updateNodeData = useWorkflowStore((s) => s.updateNodeData);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = useCallback(
    async (file: File) => {
      if (!file.type.startsWith("video/")) {
        toast.error("Please upload a video file");
        return;
      }

      const toastId = toast.loading("Uploading video...");
      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", "video");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const result = await res.json();
        if (result.url) {
          updateNodeData(id, {
            videoUrl: result.url,
            fileName: file.name,
            outputs: { video_url: result.url },
          });
          toast.success("Video uploaded!", { id: toastId });
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
        icon={Video}
        iconColor="#f59e0b"
        label={nodeData.label}
        executionStatus={nodeData.executionStatus}
      />

      <div className="node-body">
        {nodeData.videoUrl ? (
          <div className="relative group">
            <video
              src={nodeData.videoUrl}
              controls
              className="w-full rounded-lg"
              style={{ maxHeight: 140 }}
            />
            <button
              onClick={() =>
                updateNodeData(id, {
                  videoUrl: undefined,
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
              ((e.currentTarget as HTMLDivElement).style.borderColor = "#f59e0b")
            }
            onMouseLeave={(e) =>
              ((e.currentTarget as HTMLDivElement).style.borderColor = "#2d2d44")
            }
          >
            <Upload size={18} style={{ color: "#555577", margin: "0 auto 6px" }} />
            <p className="text-xs" style={{ color: "#8888aa" }}>
              Drop video or click to upload
            </p>
            <p className="text-xs mt-1" style={{ color: "#555577" }}>
              MP4, MOV, WEBM supported
            </p>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          hidden
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleUpload(file);
          }}
        />

        {/* Output handle */}
        <div className="relative flex items-center justify-end mt-1">
          <span className="handle-label mr-3">video url</span>
          <Handle
            type="source"
            position={Position.Right}
            id="video_url"
            style={{ right: -5 }}
          />
        </div>
      </div>
    </NodeWrapper>
  );
}
