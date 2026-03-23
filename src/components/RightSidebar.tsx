"use client";

import { useState, useEffect } from "react";
import {
  ChevronRight,
  ChevronLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Activity,
} from "lucide-react";
import { formatDate, formatDuration } from "@/lib/utils";
import { WorkflowExecution, NodeExecutionLog, ExecutionStatus } from "@/types/workflow";

interface RightSidebarProps {
  workflowId: string | null;
  executionId?: string | null;
}

const StatusIcon = ({ status }: { status: ExecutionStatus }) => {
  switch (status) {
    case "RUNNING":
      return <Loader2 size={12} className="text-purple-400 animate-spin" />;
    case "SUCCESS":
      return <CheckCircle size={12} className="text-green-400" />;
    case "FAILED":
      return <XCircle size={12} className="text-red-400" />;
    case "PARTIAL":
      return <AlertCircle size={12} className="text-yellow-400" />;
    default:
      return <Clock size={12} style={{ color: "#555577" }} />;
  }
};

function NodeLogItem({ log }: { log: NodeExecutionLog }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-lg border overflow-hidden"
      style={{ background: "#0a0a0f", borderColor: "#2d2d44" }}
    >
      <button
        className="flex items-center gap-2 w-full px-3 py-2 text-left"
        onClick={() => setOpen((v) => !v)}
      >
        <StatusIcon status={log.status} />
        <span className="text-xs font-medium text-white flex-1 truncate">
          {log.nodeLabel ?? log.nodeId}
        </span>
        <span className="text-xs" style={{ color: "#555577" }}>
          {log.nodeType}
        </span>
        {log.duration != null && (
          <span className="text-xs ml-1" style={{ color: "#555577" }}>
            {formatDuration(log.duration)}
          </span>
        )}
        {open ? (
          <ChevronUp size={12} style={{ color: "#555577" }} />
        ) : (
          <ChevronDown size={12} style={{ color: "#555577" }} />
        )}
      </button>

      {open && (
        <div
          className="px-3 pb-3 border-t text-xs"
          style={{ borderColor: "#1a1a2e" }}
        >
          {log.inputs && (
            <div className="mt-2">
              <p className="font-medium mb-1" style={{ color: "#8888aa" }}>
                Inputs
              </p>
              <pre
                className="rounded p-2 overflow-auto text-xs"
                style={{
                  background: "#12121c",
                  color: "#c0c0e0",
                  maxHeight: 120,
                  fontSize: 10,
                }}
              >
                {JSON.stringify(log.inputs, null, 2)}
              </pre>
            </div>
          )}
          {log.outputs && (
            <div className="mt-2">
              <p className="font-medium mb-1" style={{ color: "#8888aa" }}>
                Outputs
              </p>
              <pre
                className="rounded p-2 overflow-auto text-xs"
                style={{
                  background: "#12121c",
                  color: "#c0c0e0",
                  maxHeight: 120,
                  fontSize: 10,
                }}
              >
                {JSON.stringify(log.outputs, null, 2)}
              </pre>
            </div>
          )}
          {log.error && (
            <div className="mt-2">
              <p className="font-medium mb-1" style={{ color: "#ef4444" }}>
                Error
              </p>
              <p className="text-xs" style={{ color: "#ef4444" }}>
                {log.error}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ExecutionCard({ execution }: { execution: WorkflowExecution }) {
  const [open, setOpen] = useState(false);

  const statusColors: Record<ExecutionStatus, string> = {
    PENDING: "#555577",
    RUNNING: "#a855f7",
    SUCCESS: "#22c55e",
    FAILED: "#ef4444",
    PARTIAL: "#f59e0b",
    SKIPPED: "#3b82f6",
  };

  const scopeLabels: Record<string, string> = {
    FULL_WORKFLOW: "Full",
    SELECTED_NODES: "Selected",
    SINGLE_NODE: "Single",
  };

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{ background: "#0a0a0f", borderColor: "#2d2d44" }}
    >
      <button
        className="flex items-start gap-3 w-full px-3 py-3 text-left hover:bg-white/5 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <StatusIcon status={execution.status} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{
                background: statusColors[execution.status] + "20",
                color: statusColors[execution.status],
              }}
            >
              {execution.status}
            </span>
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: "#1a1a2e", color: "#8888aa" }}
            >
              {scopeLabels[execution.scope] ?? execution.scope}
            </span>
          </div>
          <p className="text-xs" style={{ color: "#8888aa" }}>
            {formatDate(execution.startedAt)}
          </p>
          {execution.duration != null && (
            <p className="text-xs" style={{ color: "#555577" }}>
              {formatDuration(execution.duration)}
            </p>
          )}
        </div>
        {open ? (
          <ChevronUp size={12} style={{ color: "#555577" }} />
        ) : (
          <ChevronDown size={12} style={{ color: "#555577" }} />
        )}
      </button>

      {open && execution.nodeLogs && (
        <div
          className="px-3 pb-3 border-t flex flex-col gap-2"
          style={{ borderColor: "#1a1a2e" }}
        >
          <p className="text-xs font-medium mt-2" style={{ color: "#555577" }}>
            Node Logs ({execution.nodeLogs.length})
          </p>
          {execution.nodeLogs.map((log) => (
            <NodeLogItem
              key={log.id}
              log={log as unknown as NodeExecutionLog}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function RightSidebar({ workflowId, executionId }: RightSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!workflowId) return;

    const fetchExecutions = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/workflows/${workflowId}/executions`);
        const data = await res.json();
        setExecutions(data ?? []);
      } catch {
        console.error("Failed to fetch executions");
      } finally {
        setLoading(false);
      }
    };

    fetchExecutions();

    // Poll for updates when executing
    const interval = setInterval(fetchExecutions, 3000);
    return () => clearInterval(interval);
  }, [workflowId, executionId]);

  if (collapsed) {
    return (
      <div
        className="hidden md:flex flex-col items-center py-4 gap-3 border-l"
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
          <ChevronLeft size={16} />
        </button>
        <Activity size={16} style={{ color: "#555577" }} />
      </div>
    );
  }

  return (
    <div
      className="hidden md:flex flex-col border-l"
      style={{
        width: 280,
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
        <div className="flex items-center gap-2">
          <Activity size={13} style={{ color: "#a855f7" }} />
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#555577" }}>
            Execution History
          </span>
        </div>
        <button
          onClick={() => setCollapsed(true)}
          className="w-6 h-6 rounded flex items-center justify-center transition-colors hover:bg-purple-500/20"
          style={{ color: "#555577" }}
        >
          <ChevronRight size={14} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
        {loading && executions.length === 0 ? (
          <div className="flex items-center justify-center py-10 gap-2">
            <Loader2 size={14} className="text-purple-400 animate-spin" />
            <span className="text-xs" style={{ color: "#555577" }}>Loading...</span>
          </div>
        ) : executions.length === 0 ? (
          <div className="text-center py-10">
            <Activity size={24} style={{ color: "#2d2d44", margin: "0 auto 8px" }} />
            <p className="text-xs" style={{ color: "#555577" }}>
              No executions yet
            </p>
            <p className="text-xs mt-1" style={{ color: "#2d2d44" }}>
              Run the workflow to see history
            </p>
          </div>
        ) : (
          executions.map((exec) => (
            <ExecutionCard key={exec.id} execution={exec} />
          ))
        )}
      </div>
    </div>
  );
}
