"use client";

import { cn } from "@/lib/utils";
import { ExecutionStatus } from "@/types/workflow";
import { CheckCircle, XCircle, Loader2, LucideIcon } from "lucide-react";

interface NodeWrapperProps {
  children: React.ReactNode;
  className?: string;
  executionStatus?: ExecutionStatus;
}

const statusClasses: Record<ExecutionStatus, string> = {
  PENDING: "",
  RUNNING: "node-running",
  SUCCESS: "node-success",
  FAILED: "node-error",
  PARTIAL: "node-error",
  SKIPPED: "",
};

export function NodeWrapper({
  children,
  className,
  executionStatus,
}: NodeWrapperProps) {
  return (
    <div
      className={cn(
        "workflow-node",
        executionStatus ? statusClasses[executionStatus] : "",
        className
      )}
    >
      {children}
    </div>
  );
}

interface NodeHeaderProps {
  icon: LucideIcon;
  iconColor?: string;
  label: string;
  executionStatus?: ExecutionStatus;
}

export function NodeHeader({
  icon: Icon,
  iconColor = "#a855f7",
  label,
  executionStatus,
}: NodeHeaderProps) {
  return (
    <div className="node-header">
      <div
        className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
        style={{ background: iconColor + "20" }}
      >
        <Icon size={12} style={{ color: iconColor }} />
      </div>
      <span className="text-xs font-semibold text-white flex-1 truncate">
        {label}
      </span>
      {executionStatus === "RUNNING" && (
        <Loader2 size={12} className="text-purple-400 animate-spin" />
      )}
      {executionStatus === "SUCCESS" && (
        <CheckCircle size={12} className="text-green-400" />
      )}
      {executionStatus === "FAILED" && (
        <XCircle size={12} className="text-red-400" />
      )}
    </div>
  );
}

interface HandleRowProps {
  label: string;
  side: "left" | "right";
  type: "input" | "output";
}

export function HandleRow({ label, side, type }: HandleRowProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-1 text-[10px] font-medium uppercase tracking-wider",
        side === "left" ? "justify-start" : "justify-end",
        "text-muted-foreground"
      )}
      style={{ color: "#555577", fontSize: "10px" }}
    >
      {side === "right" && <span>{label}</span>}
      <div
        className="w-2 h-2 rounded-full border"
        style={{ borderColor: "#a855f7", background: "#0a0a0f" }}
      />
      {side === "left" && <span>{label}</span>}
    </div>
  );
}
