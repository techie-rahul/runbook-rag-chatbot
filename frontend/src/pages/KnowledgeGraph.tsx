import { useState, useMemo, useCallback } from "react";
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
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

import CustomNode from "@/components/knowledge-graph/CustomNode";
import GraphToolbar from "@/components/knowledge-graph/GraphToolbar";
import GraphLegend from "@/components/knowledge-graph/GraphLegend";
import NodeDetailPanel from "@/components/knowledge-graph/NodeDetailPanel";
import { initialNodes, initialEdges, findRootCausePath } from "@/data/mockGraphData";
import type { GraphNodeData, NodeStatus } from "@/types";

const nodeTypes: NodeTypes = { custom: CustomNode };

/** Type-safe accessor for node data */
function getData(node: Node): GraphNodeData {
  return node.data as GraphNodeData;
}

function GraphCanvas() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [highlightedPath, setHighlightedPath] = useState<{ nodeIds: string[]; edgeIds: string[] }>({ nodeIds: [], edgeIds: [] });
  const [traceMessage, setTraceMessage] = useState<string | null>(null);

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