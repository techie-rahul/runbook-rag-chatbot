import { useState, useMemo, useCallback, useEffect } from "react";
import {
  ReactFlow,
  MiniMap,
  Background,
  BackgroundVariant,
  useNodesState,
  useEdgesState,
  ReactFlowProvider,
  MarkerType,
  type NodeTypes,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import CustomNode from "@/components/knowledge-graph/CustomNode";
import GraphToolbar from "@/components/knowledge-graph/GraphToolbar";
import GraphLegend from "@/components/knowledge-graph/GraphLegend";
import NodeDetailPanel from "@/components/knowledge-graph/NodeDetailPanel";
import { initialNodes, initialEdges, findRootCausePath } from "@/data/mockGraphData";
import type { GraphNodeData, NodeStatus, ServiceType } from "@/types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

const nodeTypes: NodeTypes = { custom: CustomNode };

/** Map category string to a service type for coloring */
function categoryToServiceType(category: string): ServiceType {
  const map: Record<string, ServiceType> = {
    Networking: "gateway",
    Kubernetes: "service",
    Database: "database",
    Monitoring: "monitoring",
    Docker: "service",
    Security: "service",
    Linux: "service",
    General: "service",
  };
  return map[category] ?? "service";
}

/** Type-safe accessor for node data */
function getData(node: Node): GraphNodeData {
  return node.data as GraphNodeData;
}

function GraphCanvas() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<{ nodeIds: string[]; edgeIds: string[] }>({ nodeIds: [], edgeIds: [] });
  const [traceMessage, setTraceMessage] = useState<string | null>(null);

  // ── Fetch graph from backend ───────────────────
  useEffect(() => {
    let cancelled = false;

    async function fetchGraph() {
      try {
        const res = await fetch(`${API_BASE}/graph`);
        if (!res.ok) throw new Error(`${res.status}`);
        const data: {
          nodes: Array<{ id: string; title: string; category: string }>;
          edges: Array<{ source: string; target: string }>;
        } = await res.json();

        if (cancelled) return;

        // Lay nodes out in a circle
        const count = data.nodes.length;
        const radius = Math.max(250, count * 40);
        const cx = 400, cy = 350;

        const mappedNodes: Node<GraphNodeData>[] = data.nodes.map((n, i) => {
          const angle = (2 * Math.PI * i) / count - Math.PI / 2;
          return {
            id: n.id,
            type: "custom",
            position: {
              x: cx + radius * Math.cos(angle),
              y: cy + radius * Math.sin(angle),
            },
            data: {
              label: n.title,
              serviceType: categoryToServiceType(n.category),
              status: "healthy" as NodeStatus,
              description: `${n.category} runbook`,
              relatedRunbooks: [],
            },
          };
        });

        const mappedEdges: Edge[] = data.edges.map((e, i) => ({
          id: `e-${i}`,
          source: e.source,
          target: e.target,
          animated: true,
          style: { stroke: "#3f3f46", strokeWidth: 1.5 },
          markerEnd: {
            type: MarkerType.ArrowClosed,
            color: "#3f3f46",
            width: 16,
            height: 16,
          },
        }));

        setNodes(mappedNodes);
        setEdges(mappedEdges);
      } catch {
        // Keep mock data — already set as initial state
      }
    }

    fetchGraph();
    return () => { cancelled = true; };
  }, [setNodes, setEdges]);

  const isTracing = highlightedPath.nodeIds.length > 0;

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId],
  );

  const connectedNodes = useMemo(() => {
    if (!selectedNodeId) return [];
    const ids = new Set<string>();
    edges.forEach((e) => {
      if (e.source === selectedNodeId) ids.add(e.target);
      if (e.target === selectedNodeId) ids.add(e.source);
    });
    return nodes
      .filter((n) => ids.has(n.id))
      .map((n) => {
        const d = getData(n);
        return { id: n.id, label: d.label, status: d.status as NodeStatus };
      });
  }, [nodes, edges, selectedNodeId]);

  const processedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          highlighted: highlightedPath.nodeIds.includes(node.id),
          dimmed: isTracing && !highlightedPath.nodeIds.includes(node.id),
        },
      })),
    [nodes, highlightedPath, isTracing],
  );

  const processedEdges = useMemo(
    () =>
      edges.map((edge) => {
        const isHighlighted = highlightedPath.edgeIds.includes(edge.id);
        if (!isHighlighted && !isTracing) return edge;
        if (isHighlighted) {
          return {
            ...edge,
            animated: true,
            style: { stroke: "#ef4444", strokeWidth: 3 },
            markerEnd: { type: MarkerType.ArrowClosed, color: "#ef4444", width: 18, height: 18 },
          };
        }
        return { ...edge, style: { ...edge.style, opacity: 0.15 } };
      }),
    [edges, highlightedPath, isTracing],
  );

  const handleNodeClick = useCallback((_: React.MouseEvent, node: Node) => {
    setSelectedNodeId(node.id);
    setHighlightedPath({ nodeIds: [], edgeIds: [] });
    setTraceMessage(null);
  }, []);

  const handlePaneClick = useCallback(() => {
    setSelectedNodeId(null);
    setHighlightedPath({ nodeIds: [], edgeIds: [] });
    setTraceMessage(null);
  }, []);

  const handleTraceRootCause = useCallback(() => {
    if (isTracing) {
      setHighlightedPath({ nodeIds: [], edgeIds: [] });
      setTraceMessage(null);
      return;
    }
    if (!selectedNodeId) return;

    const path = findRootCausePath(selectedNodeId, nodes, edges);
    if (path.nodeIds.length > 0) {
      setHighlightedPath(path);
      const target = nodes.find((n) => n.id === path.nodeIds[path.nodeIds.length - 1]);
      setTraceMessage(target ? `Root cause: ${getData(target).label} (Critical)` : null);
    } else {
      setTraceMessage("No critical dependencies found downstream.");
    }
  }, [selectedNodeId, nodes, edges, isTracing]);

  const handleClosePanel = useCallback(() => {
    setSelectedNodeId(null);
    setHighlightedPath({ nodeIds: [], edgeIds: [] });
    setTraceMessage(null);
  }, []);

  const selData = selectedNode ? getData(selectedNode) : null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-shrink-0 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Dependency Graph</h1>
        <p className="mt-1 text-[13px] text-zinc-500">
          Explore relationships between infrastructure components and linked runbooks.
        </p>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden rounded-xl border border-edge">
        <ReactFlow
          nodes={processedNodes}
          edges={processedEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={handleNodeClick}
          onPaneClick={handlePaneClick}
          fitView
          fitViewOptions={{ padding: 0.25 }}
          colorMode="dark"
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#1a1a20" />
          <MiniMap
            style={{ backgroundColor: "#0c0c0e" }}
            maskColor="rgba(0,0,0,0.6)"
            nodeColor="#1a1a1f"
          />
        </ReactFlow>

        <GraphToolbar />
        <GraphLegend />

        {selectedNode && selData && (
          <NodeDetailPanel
            label={selData.label}
            serviceType={selData.serviceType as string}
            status={selData.status as NodeStatus}
            description={selData.description as string}
            relatedRunbooks={selData.relatedRunbooks as string[]}
            connectedNodes={connectedNodes}
            onClose={handleClosePanel}
            onTraceRootCause={handleTraceRootCause}
            isTracing={isTracing}
            traceMessage={traceMessage}
          />
        )}
      </div>
    </div>
  );
}

export default function KnowledgeGraph() {
  return (
    <ReactFlowProvider>
      <GraphCanvas />
    </ReactFlowProvider>
  );
}