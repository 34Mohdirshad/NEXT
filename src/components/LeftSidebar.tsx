"use client";

import { useState } from "react";
import {
  Type,
  ImageIcon,
  Video,
  Cpu,
  Crop,
  Film,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import { NodeType } from "@/types/workflow";
import useWorkflowStore from "@/store/workflowStore";

const NODE_PALETTE: {
  type: NodeType;
  label: string;
  description: string;
  icon: React.ElementType;
  color: string;
}[] = [
  {
    type: "text",
    label: "Text Node",
    description: "Free-form text input",
    icon: Type,
    color: "#3b82f6",
  },
  {
    type: "uploadImage",
    label: "Upload Image",
    description: "Upload & preview images",
    icon: ImageIcon,
    color: "#ec4899",
  },
  {
    type: "uploadVideo",
    label: "Upload Video",
    description: "Upload & preview videos",
    icon: Video,
    color: "#f59e0b",
  },
  {
    type: "llm",
    label: "LLM Node",
    description: "Google Gemini multimodal AI",
    icon: Cpu,
    color: "#a855f7",
  },
  {
    type: "cropImage",
    label: "Crop Image",
    description: "FFmpeg image cropping",
    icon: Crop,
    color: "#22c55e",
  },
  {
    type: "extractFrame",
    label: "Extract Frame",
    description: "Extract video frame",
    icon: Film,
    color: "#f59e0b",
  },
];

interface LeftSidebarProps {
  onDragStart: (type: NodeType) => void;
}

export default function LeftSidebar({ onDragStart }: LeftSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const addNode = useWorkflowStore((s) => s.addNode);

  if (collapsed) {
    return (
      <div
        className="hidden md:flex flex-col items-center py-4 gap-3 border-r"
        style={{
          width: 48,
          background: "#12121c",
          borderColor: "#2d2d44",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setCollapsed(false)}
          className="w-8 h-8 rounded flex items-center justify-center transition-colors hover:bg-purple-500/20"
          style={{ color: "#555577" }}
        >
          <ChevronRight size={16} />
        </button>
        {NODE_PALETTE.map((n) => (
          <button
            key={n.type}
            title={n.label}
            onClick={() => addNode(n.type)}
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all hover:scale-110"
            style={{ background: n.color + "20" }}
          >
            <n.icon size={14} style={{ color: n.color }} />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div
      className="hidden md:flex flex-col border-r"
      style={{
        width: 220,
        background: "#12121c",
        borderColor: "#2d2d44",
        flexShrink: 0,
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "#2d2d44" }}
      >
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#555577" }}>
          Nodes
        </span>
        <button
          onClick={() => setCollapsed(true)}
          className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-purple-500/20"
          style={{ color: "#555577" }}
        >
          <ChevronLeft size={14} />
        </button>
      </div>

      {/* Node list */}
      <div className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-1">
        {NODE_PALETTE.map((nodeType) => (
          <div
            key={nodeType.type}
            draggable
            onDragStart={() => onDragStart(nodeType.type)}
            onClick={() => addNode(nodeType.type)}
            className="sidebar-item flex items-center gap-3 p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all"
            style={{ background: "transparent" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "#1a1a2e";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = "transparent";
            }}
          >
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: nodeType.color + "20" }}
            >
              <nodeType.icon size={15} style={{ color: nodeType.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-white truncate">
                {nodeType.label}
              </p>
              <p className="text-xs truncate" style={{ color: "#555577" }}>
                {nodeType.description}
              </p>
            </div>
            <GripVertical size={12} style={{ color: "#2d2d44", flexShrink: 0 }} />
          </div>
        ))}
      </div>

      {/* Tip */}
      <div
        className="px-4 py-3 border-t text-xs"
        style={{ borderColor: "#2d2d44", color: "#555577" }}
      >
        Click or drag nodes onto canvas
      </div>
    </div>
  );
}
