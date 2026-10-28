/* ──────────────────────────────────────────────
   Shared TypeScript interfaces for OpsPilot.
   ────────────────────────────────────────────── */

// ── Navigation & Layout ───────────────────────

export interface NavItem {
  label: string;
  path: string;
  icon: string;
}

export type ServiceStatus = "online" | "offline" | "degraded";

export interface ServiceHealth {
  label: string;
  status: ServiceStatus;
}

export interface RouteConfig {
  path: string;
  title: string;
  description: string;
}

// ── Chat ──────────────────────────────────────

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  sources?: RetrievedSource[];
  analysis?: IncidentAnalysis;
  /** Chunks retrieved from the backend RAG pipeline */
  sourceChunks?: string[];
  /** Runbook titles expanded via graph neighbors */
  expandedViaGraph?: string[];
  /** Knowledge graph edges used during one-hop expansion */
  graphEdgesUsed?: string[];
  /** Whether the LLM was confident in its answer */
  confident?: boolean;
  /** True when the fetch itself failed */
  isError?: boolean;
}

export interface RetrievedSource {
  id: string;
  title: string;
  relevanceScore: number;
  snippet: string;
  content: string;
  category: string;
}

export interface IncidentAnalysis {
  summary: string;
  rootCause: string;
  suggestedResolution: string;
  confidence: number;
  relatedRunbooks: RelatedRunbook[];
}

export interface RelatedRunbook {
  id: string;
  title: string;
  category: string;
}

// ── Dependency Graph ──────────────────────────

export type NodeStatus = "healthy" | "warning" | "critical";

export type ServiceType =
  | "gateway"
  | "service"
  | "database"
  | "cache"
  | "queue"
  | "monitoring"
  | "visualization";

export interface GraphNodeData {
  [key: string]: unknown; // required by @xyflow/react v12
  label: string;
  serviceType: ServiceType;
  status: NodeStatus;
  description: string;
  relatedRunbooks: string[];
  highlighted?: boolean;
  dimmed?: boolean;
}

// ── Runbooks ──────────────────────────────────

export type RunbookCategory =
  | "Kubernetes"
  | "Networking"
  | "Database"
  | "Monitoring"
  | "Security"
  | "Docker"
  | "Linux"
  | "General";

export type RunbookSeverity = "Critical" | "High" | "Medium" | "Low";

export interface RunbookData {
  id: string;
  title: string;
  category: RunbookCategory;
  severity: RunbookSeverity;
  description: string;
  tags: string[];
  lastUpdated: string;
  readingTime: number;
  symptoms: string[];
  possibleCauses: string[];
  resolutionSteps: string[];
  verificationSteps: string[];
  relatedRunbooks: string[];
  references: string[];
}
