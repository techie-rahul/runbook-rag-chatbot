import { type Node, type Edge, MarkerType } from "@xyflow/react";
import type { GraphNodeData, NodeStatus } from "@/types";

export const initialNodes: Node<GraphNodeData>[] = [
  {
    id: "api-gateway",
    type: "custom",
    position: { x: 400, y: 0 },
    data: {
      label: "API Gateway",
      serviceType: "gateway",
      status: "healthy",
      description: "Central entry point handling all incoming API requests. Routes traffic to downstream microservices with rate limiting and authentication.",
      relatedRunbooks: ["API Gateway Troubleshooting", "Rate Limiting Configuration", "SSL Certificate Renewal"],
    },
  },
  {
    id: "auth-service",
    type: "custom",
    position: { x: 100, y: 180 },
    data: {
      label: "Auth Service",
      serviceType: "service",
      status: "healthy",
      description: "Handles user authentication, JWT token generation, and session management. Depends on Redis for session caching.",
      relatedRunbooks: ["Auth Token Debugging", "SSO Configuration Guide"],
    },
  },
  {
    id: "orders-service",
    type: "custom",
    position: { x: 400, y: 180 },
    data: {
      label: "Orders Service",
      serviceType: "service",
      status: "warning",
      description: "Processes order creation, updates, and fulfillment. Currently experiencing elevated latency due to downstream message queue issues.",
      relatedRunbooks: ["Order Processing Failures", "Queue Backpressure Handling"],
    },
  },
  {
    id: "monitoring",
    type: "custom",
    position: { x: 720, y: 180 },
    data: {
      label: "Monitoring",
      serviceType: "monitoring",
      status: "healthy",
      description: "Collects metrics, traces, and logs from all services. Pushes data to Prometheus for storage and alerting.",
      relatedRunbooks: ["Monitoring Setup Guide", "Alert Rule Configuration"],
    },
  },
  {
    id: "redis",
    type: "custom",
    position: { x: 100, y: 360 },
    data: {
      label: "Redis",
      serviceType: "cache",
      status: "healthy",
      description: "In-memory cache for session data, rate limiting counters, and hot query results. Connected to PostgreSQL for cache-aside patterns.",
      relatedRunbooks: ["Redis Latency Diagnosis", "Redis Memory Management", "Cache Invalidation Strategy"],
    },
  },
  {
    id: "rabbitmq",
    type: "custom",
    position: { x: 400, y: 360 },
    data: {
      label: "RabbitMQ",
      serviceType: "queue",
      status: "warning",
      description: "Message broker for async order processing. Queue depth is growing due to slow consumer processing caused by database connection issues.",
      relatedRunbooks: ["RabbitMQ Queue Management", "Dead Letter Queue Setup"],
    },
  },
  {
    id: "prometheus",
    type: "custom",
    position: { x: 720, y: 360 },
    data: {
      label: "Prometheus",
      serviceType: "monitoring",
      status: "healthy",
      description: "Time-series database for metrics storage. Scrapes all service endpoints every 15 seconds and evaluates alerting rules.",
      relatedRunbooks: ["Prometheus Storage Scaling", "PromQL Query Guide"],
    },
  },
  {
    id: "postgresql",
    type: "custom",
    position: { x: 250, y: 540 },
    data: {
      label: "PostgreSQL",
      serviceType: "database",
      status: "critical",
      description: "Primary relational database. Currently experiencing connection exhaustion — active connections at 300/300 max limit. Causing cascading failures across dependent services.",
      relatedRunbooks: ["PostgreSQL Connection Management", "Database Connection Exhaustion", "PostgreSQL High CPU", "Connection Pool Best Practices"],
    },
  },
  {
    id: "grafana",
    type: "custom",
    position: { x: 720, y: 540 },
    data: {
      label: "Grafana",
      serviceType: "visualization",
      status: "healthy",
      description: "Dashboard and visualization platform. Queries Prometheus for real-time infrastructure and application metrics.",
      relatedRunbooks: ["Grafana Dashboard Setup", "Alert Channel Configuration"],
    },
  },
];

function edgeStyle(status: "healthy" | "warning" | "critical") {
  const colors = { healthy: "#3f3f46", warning: "#a16207", critical: "#b91c1c" };
  return { stroke: colors[status], strokeWidth: 1.5 };
}

function marker(status: "healthy" | "warning" | "critical") {
  const colors = { healthy: "#3f3f46", warning: "#a16207", critical: "#b91c1c" };
  return { type: MarkerType.ArrowClosed, color: colors[status], width: 16, height: 16 };
}

export const initialEdges: Edge[] = [
  { id: "e-gw-auth", source: "api-gateway", target: "auth-service", animated: true, style: edgeStyle("healthy"), markerEnd: marker("healthy") },
  { id: "e-gw-orders", source: "api-gateway", target: "orders-service", animated: true, style: edgeStyle("warning"), markerEnd: marker("warning") },
  { id: "e-gw-mon", source: "api-gateway", target: "monitoring", animated: true, style: edgeStyle("healthy"), markerEnd: marker("healthy") },
  { id: "e-auth-redis", source: "auth-service", target: "redis", animated: true, style: edgeStyle("healthy"), markerEnd: marker("healthy") },
  { id: "e-orders-rmq", source: "orders-service", target: "rabbitmq", animated: true, style: edgeStyle("warning"), markerEnd: marker("warning") },
  { id: "e-redis-pg", source: "redis", target: "postgresql", animated: true, style: edgeStyle("critical"), markerEnd: marker("critical") },
  { id: "e-rmq-pg", source: "rabbitmq", target: "postgresql", animated: true, style: edgeStyle("critical"), markerEnd: marker("critical") },
  { id: "e-mon-prom", source: "monitoring", target: "prometheus", animated: true, style: edgeStyle("healthy"), markerEnd: marker("healthy") },
  { id: "e-prom-grafana", source: "prometheus", target: "grafana", style: { ...edgeStyle("healthy"), strokeDasharray: "5 5" }, markerEnd: marker("healthy") },
];

/** BFS from startId to nearest critical node downstream */
export function findRootCausePath(
  startId: string,
  nodes: Node[],
  edges: Edge[],
): { nodeIds: string[]; edgeIds: string[] } {
  const visited = new Set<string>();
  const queue: Array<{ nodeId: string; nodePath: string[]; edgePath: string[] }> = [
    { nodeId: startId, nodePath: [startId], edgePath: [] },
  ];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.nodeId)) continue;
    visited.add(current.nodeId);

    if (current.nodeId !== startId) {
      const node = nodes.find((n) => n.id === current.nodeId);
      if (node && (node.data as GraphNodeData).status === ("critical" as NodeStatus)) {
        return { nodeIds: current.nodePath, edgeIds: current.edgePath };
      }
    }

    const outgoing = edges.filter((e) => e.source === current.nodeId);
    for (const edge of outgoing) {
      if (!visited.has(edge.target)) {
        queue.push({
          nodeId: edge.target,
          nodePath: [...current.nodePath, edge.target],
          edgePath: [...current.edgePath, edge.id],
        });
      }
    }
  }

  return { nodeIds: [], edgeIds: [] };
}
