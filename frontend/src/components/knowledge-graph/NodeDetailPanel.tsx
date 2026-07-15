import { X, Crosshair, BookOpen } from "lucide-react";
import type { NodeStatus } from "@/types";

interface ConnectedNode {
  id: string;
  label: string;
  status: NodeStatus;
}

interface NodeDetailPanelProps {
  label: string;
  serviceType: string;
  status: NodeStatus;
  description: string;
  relatedRunbooks: string[];
  connectedNodes: ConnectedNode[];
  onClose: () => void;
  onTraceRootCause: () => void;
  isTracing: boolean;
  traceMessage: string | null;
}

const STATUS_BADGE: Record<NodeStatus, { bg: string; text: string; label: string }> = {
  healthy: { bg: "bg-success/10", text: "text-success", label: "Healthy" },
  warning: { bg: "bg-warning/10", text: "text-warning", label: "Warning" },
  critical: { bg: "bg-danger/10", text: "text-danger", label: "Critical" },
};

const DOT_COLOR: Record<NodeStatus, string> = {
  healthy: "bg-success",
  warning: "bg-warning",
  critical: "bg-danger",
};

export default function NodeDetailPanel({
  label, serviceType, status, description, relatedRunbooks,
  connectedNodes, onClose, onTraceRootCause, isTracing, traceMessage,
}: NodeDetailPanelProps) {
  const badge = STATUS_BADGE[status];

  return (
    <div className="absolute top-0 right-0 z-20 flex h-full w-80 flex-col border-l border-edge bg-sidebar">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-edge px-4 py-3">
        <h3 className="text-[14px] font-semibold text-zinc-100">{label}</h3>
        <button onClick={onClose} className="rounded-lg p-1 text-zinc-500 hover:bg-elevated hover:text-zinc-300">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-5 overflow-y-auto px-4 py-4">
        {/* Type & Status */}
        <div className="flex items-center gap-2">
          <span className="rounded-md bg-elevated px-2 py-0.5 text-[11px] font-medium capitalize text-zinc-400">
            {serviceType}
          </span>
          <span className={`rounded-md px-2 py-0.5 text-[11px] font-medium ${badge.bg} ${badge.text}`}>
            {badge.label}
          </span>
        </div>

        {/* Description */}
        <div>
          <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Description</p>
          <p className="text-[12px] leading-relaxed text-zinc-400">{description}</p>
        </div>

        {/* Connected Services */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Connected Services</p>
          <div className="space-y-1.5">
            {connectedNodes.map((cn) => (
              <div key={cn.id} className="flex items-center gap-2 rounded-lg bg-elevated px-3 py-2">
                <span className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[cn.status]}`} />
                <span className="text-[12px] text-zinc-300">{cn.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Related Runbooks */}
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Related Runbooks</p>
          <div className="space-y-1.5">
            {relatedRunbooks.map((rb) => (
              <div key={rb} className="flex items-center gap-2 rounded-lg border border-edge px-3 py-2 transition-colors hover:border-edge-hover">
                <BookOpen className="h-3 w-3 flex-shrink-0 text-zinc-600" />
                <span className="text-[12px] text-zinc-400">{rb}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Trace Root Cause */}
        <button
          onClick={onTraceRootCause}
          className={`flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-[12px] font-medium transition-colors ${
            isTracing
              ? "bg-danger/10 text-danger"
              : "bg-accent/10 text-accent hover:bg-accent/20"
          }`}
        >
          <Crosshair className="h-3.5 w-3.5" />
          {isTracing ? "Clear Root Cause Path" : "Trace Root Cause"}
        </button>

        {traceMessage && (
          <p className="text-center text-[11px] text-zinc-500">{traceMessage}</p>
        )}
      </div>
    </div>
  );
}
