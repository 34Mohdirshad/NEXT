"use client";

import { useEffect, useState, useCallback } from "react";
import { ReactFlowProvider } from "@xyflow/react";
import useWorkflowStore from "@/store/workflowStore";
import Toolbar from "@/components/Toolbar";
import LeftSidebar from "@/components/LeftSidebar";
import RightSidebar from "@/components/RightSidebar";
import WorkflowCanvas from "@/components/WorkflowCanvas";
import { NodeType, ExecutionScope, Workflow } from "@/types/workflow";
import toast from "react-hot-toast";

interface Props {
  workflow: Workflow;
}

export default function WorkflowEditor({ workflow }: Props) {
  const {
    setWorkflowId,
    setWorkflowName,
    setWorkflowDescription,
    setNodes,
    setEdges,
    setIsExecuting,
    setExecutionId,
    updateNodeStatus,
    clearAllNodeStatuses,
    nodes,
    edges,
    selectedNodes,
    isExecuting,
    executionId,
  } = useWorkflowStore();

  const [draggingNodeType, setDraggingNodeType] = useState<NodeType | null>(null);

  // Initialize store from loaded workflow
  useEffect(() => {
    setWorkflowId(workflow.id);
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description ?? "");

    const definition = workflow.definition as { nodes: unknown[]; edges: unknown[] };
    setNodes((definition.nodes ?? []) as Parameters<typeof setNodes>[0]);
    setEdges((definition.edges ?? []) as Parameters<typeof setEdges>[0]);
  }, [workflow.id]); // only run once on mount

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nodes, edges]);

  async function handleSave() {
    const { isSaving, setIsSaving, workflowName, workflowDescription } =
      useWorkflowStore.getState();
    if (isSaving) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/workflows/${workflow.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: workflowName,
          description: workflowDescription,
          definition: { nodes, edges },
        }),
      });
      if (res.ok) toast.success("Saved!");
      else throw new Error();
    } catch {
      toast.error("Failed to save");
    } finally {
      useWorkflowStore.getState().setIsSaving(false);
    }
  }

  const handleRun = useCallback(
    async (scope: ExecutionScope) => {
      if (isExecuting) return;

      clearAllNodeStatuses();
      setIsExecuting(true);

      try {
        const body: Record<string, unknown> = {
          nodes,
          edges,
          scope,
        };

        if (scope === "SELECTED_NODES") {
          body.selectedNodeIds = selectedNodes;
        }

        // Mark nodes as running
        const targetNodes =
          scope === "FULL_WORKFLOW"
            ? nodes.map((n) => n.id)
            : scope === "SELECTED_NODES"
            ? selectedNodes
            : [];

        targetNodes.forEach((id) => updateNodeStatus(id, "RUNNING"));

        const res = await fetch(`/api/workflows/${workflow.id}/execute`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? "Execution failed");
        }

        setExecutionId(data.executionId);
        toast.success("Execution started!");

        // Update node statuses from execution result
        if (data.nodeResults) {
          data.nodeResults.forEach(
            (r: { nodeId: string; status: string; outputs?: unknown }) => {
              updateNodeStatus(
                r.nodeId,
                r.status as Parameters<typeof updateNodeStatus>[1]
              );

              // Update node outputs
              if (r.outputs) {
                useWorkflowStore
                  .getState()
                  .updateNodeData(r.nodeId, { outputs: r.outputs as Record<string, unknown> });
              }
            }
          );
        }

        // Check final status
        const failCount = data.nodeResults?.filter(
          (r: { status: string }) => r.status === "FAILED"
        ).length ?? 0;

        if (failCount === 0) {
          toast.success("Workflow completed successfully!");
        } else {
          toast.error(`${failCount} node(s) failed`);
        }
      } catch (e) {
        toast.error((e as Error).message ?? "Execution failed");
        nodes.forEach((n) => updateNodeStatus(n.id, "FAILED"));
      } finally {
        setIsExecuting(false);
      }
    },
    [isExecuting, nodes, edges, selectedNodes, workflow.id]
  );

  return (
    <div className="flex flex-col" style={{ height: "100vh" }}>
      <ReactFlowProvider>
        <Toolbar workflowId={workflow.id} onRun={handleRun} />
        <div className="flex flex-1 overflow-hidden">
          <LeftSidebar onDragStart={(type) => setDraggingNodeType(type)} />
          <WorkflowCanvas
            draggingNodeType={draggingNodeType}
            onDragEnd={() => setDraggingNodeType(null)}
          />
          <RightSidebar workflowId={workflow.id} executionId={executionId} />
        </div>
      </ReactFlowProvider>
    </div>
  );
}
