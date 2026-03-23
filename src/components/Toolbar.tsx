"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Save,
  Play,
  Zap,
  Undo2,
  Redo2,
  Download,
  Upload,
  Trash2,
  PlayCircle,
  ChevronDown,
  Check,
  ArrowLeft,
} from "lucide-react";
import useWorkflowStore from "@/store/workflowStore";
import { useStore } from "zustand";
import toast from "react-hot-toast";
import { ExecutionScope } from "@/types/workflow";

interface ToolbarProps {
  workflowId: string;
  onRun: (scope: ExecutionScope) => Promise<void>;
}

export default function Toolbar({ workflowId, onRun }: ToolbarProps) {
  const router = useRouter();
  const {
    workflowName,
    workflowDescription,
    isSaving,
    isExecuting,
    selectedNodes,
    setWorkflowName,
    exportWorkflow,
    importWorkflow,
    clearWorkflow,
    nodes,
    edges,
  } = useWorkflowStore();

  const { undo, redo, pastStates, futureStates } = useStore(useWorkflowStore.temporal);

  const [showRunMenu, setShowRunMenu] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function saveWorkflow() {
    try {
      const res = await fetch(`/api/workflows/${workflowId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflowName,
          description: workflowDescription,
          definition: { nodes, edges },
        }),
      });
      if (res.ok) {
        toast.success("Workflow saved");
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Failed to save");
    }
  }

  function handleExport() {
    const json = exportWorkflow();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${workflowName.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Workflow exported");
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        importWorkflow(ev.target?.result as string);
        toast.success("Workflow imported");
      } catch {
        toast.error("Invalid workflow file");
      }
    };
    reader.readAsText(file);
  }

  return (
    <header
      className="flex items-center gap-2 md:gap-3 px-2 md:px-4 py-2.5 border-b z-10 overflow-x-auto whitespace-nowrap"
      style={{ background: "#12121c", borderColor: "#2d2d44", minHeight: 52 }}
    >
      {/* Back */}
      <button
        onClick={() => router.push("/dashboard")}
        className="w-8 h-8 rounded flex items-center justify-center transition-colors hover:bg-white/10"
        style={{ color: "#8888aa" }}
      >
        <ArrowLeft size={16} />
      </button>

      {/* Logo */}
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
      >
        <Zap size={13} className="text-white" />
      </div>

      {/* Workflow name */}
      {editingName ? (
        <input
          autoFocus
          className="node-input text-sm font-medium"
          style={{ maxWidth: 200 }}
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
          onBlur={() => setEditingName(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") setEditingName(false);
          }}
        />
      ) : (
        <button
          onClick={() => setEditingName(true)}
          className="text-sm font-medium text-white hover:text-purple-300 transition-colors max-w-48 truncate"
        >
          {workflowName}
        </button>
      )}

      <div className="flex-1" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => undo()}
          disabled={pastStates.length === 0}
          className="w-8 h-8 rounded flex items-center justify-center transition-colors disabled:opacity-30"
          style={{ color: "#8888aa" }}
          title="Undo (Ctrl+Z)"
        >
          <Undo2 size={15} />
        </button>
        <button
          onClick={() => redo()}
          disabled={futureStates.length === 0}
          className="w-8 h-8 rounded flex items-center justify-center transition-colors disabled:opacity-30"
          style={{ color: "#8888aa" }}
          title="Redo (Ctrl+Y)"
        >
          <Redo2 size={15} />
        </button>
      </div>

      <div className="w-px h-5" style={{ background: "#2d2d44" }} />

      {/* Export/Import */}
      <button
        onClick={handleExport}
        className="w-8 h-8 rounded flex items-center justify-center transition-colors hover:bg-white/10"
        style={{ color: "#8888aa" }}
        title="Export workflow"
      >
        <Download size={15} />
      </button>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-8 h-8 rounded flex items-center justify-center transition-colors hover:bg-white/10"
        style={{ color: "#8888aa" }}
        title="Import workflow"
      >
        <Upload size={15} />
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        hidden
        onChange={handleImport}
      />

      <button
        onClick={() => {
          if (confirm("Clear all nodes and edges?")) clearWorkflow();
        }}
        className="w-8 h-8 rounded flex items-center justify-center transition-colors hover:bg-red-500/20"
        style={{ color: "#8888aa" }}
        title="Clear workflow"
      >
        <Trash2 size={15} />
      </button>

      <div className="w-px h-5" style={{ background: "#2d2d44" }} />

      {/* Save */}
      <button
        onClick={saveWorkflow}
        disabled={isSaving}
        className="btn-secondary h-8 px-3 text-xs"
      >
        <Save size={13} />
        {isSaving ? "Saving..." : "Save"}
      </button>

      {/* Run button with dropdown */}
      <div className="relative">
        <div className="flex">
          <button
            onClick={() => onRun("FULL_WORKFLOW")}
            disabled={isExecuting}
            className="btn-primary h-8 px-3 text-xs rounded-r-none"
          >
            <Play size={13} />
            {isExecuting ? "Running..." : "Run All"}
          </button>
          <button
            onClick={() => setShowRunMenu((v) => !v)}
            disabled={isExecuting}
            className="btn-primary h-8 px-2 rounded-l-none border-l"
            style={{ borderColor: "rgba(255,255,255,0.2)" }}
          >
            <ChevronDown size={12} />
          </button>
        </div>

        {showRunMenu && (
          <div
            className="absolute right-0 top-full mt-1 rounded-lg border overflow-hidden z-50 min-w-44"
            style={{ background: "#12121c", borderColor: "#2d2d44" }}
          >
            <button
              onClick={() => {
                onRun("FULL_WORKFLOW");
                setShowRunMenu(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-white/10 transition-colors"
              style={{ color: "#f0f0ff" }}
            >
              <Play size={13} />
              Run Full Workflow
            </button>
            <button
              onClick={() => {
                onRun("SELECTED_NODES");
                setShowRunMenu(false);
              }}
              disabled={selectedNodes.length === 0}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm hover:bg-white/10 transition-colors disabled:opacity-40"
              style={{ color: "#f0f0ff" }}
            >
              <Check size={13} />
              Run Selected ({selectedNodes.length})
            </button>
          </div>
        )}
      </div>

      <UserButton />
    </header>
  );
}
