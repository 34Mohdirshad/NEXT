import {
  WorkflowNode,
  WorkflowEdge,
  DAGNode,
  ExecutionPlan,
  NodeType,
  AnyNodeData,
} from "@/types/workflow";

/**
 * Builds a DAG from nodes and edges, returns execution layers for parallel processing.
 * Throws if circular dependency detected.
 */
export function buildDAG(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ExecutionPlan {
  const nodeMap = new Map<string, DAGNode>();

  // Initialize all nodes
  nodes.forEach((node) => {
    nodeMap.set(node.id, {
      id: node.id,
      type: node.type as NodeType,
      data: node.data as AnyNodeData,
      dependencies: [],
      dependents: [],
    });
  });

  // Build dependency graph from edges
  edges.forEach((edge) => {
    const source = nodeMap.get(edge.source);
    const target = nodeMap.get(edge.target);
    if (source && target) {
      target.dependencies.push(edge.source);
      source.dependents.push(edge.target);
    }
  });

  // Topological sort using Kahn's algorithm
  const inDegree = new Map<string, number>();
  nodeMap.forEach((node, id) => {
    inDegree.set(id, node.dependencies.length);
  });

  const queue: string[] = [];
  inDegree.forEach((degree, id) => {
    if (degree === 0) queue.push(id);
  });

  const layers: string[][] = [];
  let processed = 0;

  while (queue.length > 0) {
    const currentLayer = [...queue];
    queue.length = 0;
    layers.push(currentLayer);

    currentLayer.forEach((nodeId) => {
      processed++;
      const node = nodeMap.get(nodeId)!;
      node.dependents.forEach((dependentId) => {
        const newDegree = (inDegree.get(dependentId) ?? 0) - 1;
        inDegree.set(dependentId, newDegree);
        if (newDegree === 0) queue.push(dependentId);
      });
    });
  }

  if (processed !== nodes.length) {
    throw new Error("Circular dependency detected in workflow graph");
  }

  return { layers, nodeMap };
}

/**
 * Validates that a workflow has no circular dependencies.
 */
export function validateDAG(
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): { valid: boolean; error?: string } {
  try {
    buildDAG(nodes, edges);
    return { valid: true };
  } catch (e) {
    return { valid: false, error: (e as Error).message };
  }
}

/**
 * Get the nodes reachable from a set of starting nodes (for partial execution).
 */
export function getReachableNodes(
  startNodeIds: string[],
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): string[] {
  const { nodeMap } = buildDAG(nodes, edges);
  const visited = new Set<string>();
  const queue = [...startNodeIds];

  while (queue.length > 0) {
    const id = queue.shift()!;
    if (visited.has(id)) continue;
    visited.add(id);
    const node = nodeMap.get(id);
    if (node) {
      node.dependents.forEach((dep) => queue.push(dep));
    }
  }

  return Array.from(visited);
}

/**
 * Get execution plan for specific nodes (respects dependencies).
 */
export function getPartialExecutionPlan(
  targetNodeIds: string[],
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): ExecutionPlan {
  const targetSet = new Set(targetNodeIds);
  const filteredNodes = nodes.filter((n) => targetSet.has(n.id));
  const filteredEdges = edges.filter(
    (e) => targetSet.has(e.source) && targetSet.has(e.target)
  );
  return buildDAG(filteredNodes, filteredEdges);
}
