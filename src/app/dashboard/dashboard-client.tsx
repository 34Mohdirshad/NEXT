"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import {
  Plus,
  Zap,
  Clock,
  CheckCircle,
  XCircle,
  GitBranch,
  Download,
  Upload,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface WorkflowWithExecution {
  id: string;
  name: string;
  description: string | null;
  updatedAt: string;
  createdAt: string;
  executions: {
    id: string;
    status: string;
    startedAt: string;
    completedAt: string | null;
    duration: number | null;
  }[];
}

interface Props {
  workflows: WorkflowWithExecution[];
}

export default function DashboardClient({ workflows: initial }: Props) {
  const router = useRouter();
  const [workflows, setWorkflows] = useState(initial);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showCreate, setShowCreate] = useState(false);

  async function createWorkflow() {
    if (!newName.trim()) return;
    setIsCreating(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          definition: { nodes: [], edges: [] },
        }),
      });
      const data = await res.json();
      if (data.id) {
        toast.success("Workflow created!");
        router.push(`/workflow/${data.id}`);
      }
    } catch {
      toast.error("Failed to create workflow");
    } finally {
      setIsCreating(false);
    }
  }

  async function deleteWorkflow(id: string) {
    if (!confirm("Delete this workflow?")) return;
    try {
      await fetch(`/api/workflows/${id}`, { method: "DELETE" });
      setWorkflows((prev) => prev.filter((w) => w.id !== id));
      toast.success("Workflow deleted");
    } catch {
      toast.error("Failed to delete");
    }
  }

  async function createSampleWorkflow() {
    const sampleDefinition = {
      nodes: [
        { id: "n1", type: "uploadImage", position: { x: 80, y: 150 }, data: { label: "Product Image", imageUrl: "" } },
        { id: "n2", type: "uploadVideo", position: { x: 80, y: 350 }, data: { label: "Product Video", videoUrl: "" } },
        { id: "n3", type: "cropImage", position: { x: 360, y: 150 }, data: { label: "Crop Image", xPercent: 0, yPercent: 0, widthPercent: 100, heightPercent: 100 } },
        { id: "n4", type: "extractFrame", position: { x: 360, y: 350 }, data: { label: "Extract Frame", timestamp: "0" } },
        { id: "n5", type: "text", position: { x: 640, y: 80 }, data: { label: "System Prompt", text: "You are a product marketing expert." } },
        { id: "n6", type: "text", position: { x: 640, y: 220 }, data: { label: "Product Details", text: "Describe this product and its key features." } },
        { id: "n7", type: "llm", position: { x: 900, y: 150 }, data: { label: "Product Description LLM", systemPrompt: "", userMessage: "" } },
        { id: "n8", type: "llm", position: { x: 1160, y: 280 }, data: { label: "Marketing Post LLM", systemPrompt: "Generate a compelling tweet-length marketing post.", userMessage: "" } },
      ],
      edges: [
        { id: "e1", source: "n1", target: "n3", sourceHandle: "image_url", targetHandle: "image_url" },
        { id: "e2", source: "n2", target: "n4", sourceHandle: "video_url", targetHandle: "video_url" },
        { id: "e3", source: "n5", target: "n7", sourceHandle: "text", targetHandle: "system_prompt" },
        { id: "e4", source: "n6", target: "n7", sourceHandle: "text", targetHandle: "user_message" },
        { id: "e5", source: "n3", target: "n7", sourceHandle: "image_url", targetHandle: "image_input_1" },
        { id: "e6", source: "n7", target: "n8", sourceHandle: "text", targetHandle: "user_message" },
        { id: "e7", source: "n3", target: "n8", sourceHandle: "image_url", targetHandle: "image_input_1" },
        { id: "e8", source: "n4", target: "n8", sourceHandle: "image_url", targetHandle: "image_input_2" },
      ],
    };

    setIsCreating(true);
    try {
      const res = await fetch("/api/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: "Product Marketing Kit Generator",
          description: "Branch A: Image → Crop → LLM. Branch B: Video → Extract Frame. Both merge into marketing post LLM.",
          definition: sampleDefinition,
        }),
      });
      const data = await res.json();
      if (data.id) {
        toast.success("Sample workflow created!");
        router.push(`/workflow/${data.id}`);
      }
    } catch {
      toast.error("Failed to create sample workflow");
    } finally {
      setIsCreating(false);
    }
  }

  const statusIcons: Record<string, React.ReactNode> = {
    SUCCESS: <CheckCircle size={12} className="text-green-400" />,
    FAILED: <XCircle size={12} className="text-red-400" />,
    RUNNING: <Clock size={12} className="text-purple-400" />,
    PARTIAL: <Clock size={12} className="text-yellow-400" />,
  };

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f" }}>
      {/* Topbar */}
      <header
        className="flex items-center justify-between px-4 md:px-6 py-4 border-b"
        style={{ background: "#12121c", borderColor: "#2d2d44" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #7c3aed, #a855f7)" }}
          >
            <Zap size={15} className="text-white" />
          </div>
          <span className="font-semibold text-white">FlowCraft AI</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={createSampleWorkflow}
            disabled={isCreating}
            className="btn-secondary text-xs"
          >
            <GitBranch size={13} /> Sample Workflow
          </button>
          <UserButton />
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 md:px-6 py-6 md:py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">My Workflows</h1>
            <p style={{ color: "#8888aa", fontSize: "14px" }}>
              {workflows.length} workflow{workflows.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button
            onClick={() => setShowCreate(true)}
            className="btn-primary"
          >
            <Plus size={16} /> New Workflow
          </button>
        </div>

        {/* Create modal */}
        {showCreate && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: "rgba(0,0,0,0.7)" }}
          >
            <div
              className="rounded-xl p-6 w-full max-w-md border mx-4"
              style={{ background: "#12121c", borderColor: "#2d2d44" }}
            >
              <h2 className="font-semibold text-white mb-4">Create Workflow</h2>
              <input
                type="text"
                placeholder="Workflow name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && createWorkflow()}
                className="node-input w-full mb-4"
                autoFocus
              />
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => setShowCreate(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  onClick={createWorkflow}
                  disabled={!newName.trim() || isCreating}
                  className="btn-primary"
                >
                  {isCreating ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Workflow grid */}
        {workflows.length === 0 ? (
          <div className="text-center py-20">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "#1a1a2e" }}
            >
              <GitBranch size={24} style={{ color: "#555577" }} />
            </div>
            <h3 className="font-medium text-white mb-2">No workflows yet</h3>
            <p className="text-sm mb-6" style={{ color: "#8888aa" }}>
              Create your first workflow or try the sample one
            </p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <Plus size={16} /> Create Workflow
              </button>
              <button onClick={createSampleWorkflow} className="btn-secondary">
                <GitBranch size={16} /> Try Sample
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {workflows.map((wf) => {
              const lastExec = wf.executions[0];
              return (
                <div
                  key={wf.id}
                  className="rounded-xl border overflow-hidden group transition-all duration-200 hover:border-purple-500/50"
                  style={{ background: "#12121c", borderColor: "#2d2d44" }}
                >
                  <Link href={`/workflow/${wf.id}`} className="block p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center"
                        style={{ background: "rgba(168, 85, 247, 0.15)" }}
                      >
                        <GitBranch size={16} style={{ color: "#a855f7" }} />
                      </div>
                      {lastExec && (
                        <div className="flex items-center gap-1">
                          {statusIcons[lastExec.status] ?? null}
                          <span
                            className="text-xs"
                            style={{ color: "#555577" }}
                          >
                            {lastExec.status}
                          </span>
                        </div>
                      )}
                    </div>
                    <h3 className="font-medium text-white mb-1 truncate">
                      {wf.name}
                    </h3>
                    {wf.description && (
                      <p
                        className="text-xs mb-3 line-clamp-2"
                        style={{ color: "#8888aa" }}
                      >
                        {wf.description}
                      </p>
                    )}
                    <div
                      className="flex items-center gap-1 text-xs"
                      style={{ color: "#555577" }}
                    >
                      <Clock size={11} />
                      {formatDate(wf.updatedAt)}
                    </div>
                  </Link>
                  <div
                    className="flex items-center border-t px-5 py-2 gap-2"
                    style={{ borderColor: "#1a1a2e" }}
                  >
                    <Link
                      href={`/workflow/${wf.id}`}
                      className="text-xs font-medium"
                      style={{ color: "#a855f7" }}
                    >
                      Open →
                    </Link>
                    <div className="flex-1" />
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        deleteWorkflow(wf.id);
                      }}
                      className="p-1 rounded transition-colors hover:text-red-400"
                      style={{ color: "#555577" }}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
