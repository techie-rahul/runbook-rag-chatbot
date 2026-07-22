import type { RunbookCategory } from "@/types";

export const CATEGORY_COLORS: Record<RunbookCategory, string> = {
  Kubernetes: "#3b82f6",
  Networking: "#8b5cf6",
  Database: "#f59e0b",
  Monitoring: "#22c55e",
  Security: "#ef4444",
  Docker: "#06b6d4",
  Linux: "#eab308",
  General: "#71717a",
};

export const ALL_CATEGORIES: RunbookCategory[] = [
  "Kubernetes",
  "Networking",
  "Database",
  "Monitoring",
  "Security",
  "Docker",
  "Linux",
  "General",
];