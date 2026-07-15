import { Handle, Position } from "@xyflow/react";
import type { NodeProps } from "@xyflow/react";
import {
  Globe, Server, Database, Zap,
  ArrowLeftRight, Activity, BarChart3,
} from "lucide-react";
import type { ServiceType, NodeStatus } from "@/types";

const ICONS: Record<ServiceType, React.ComponentType<{ className?: string }>> = {
  gateway: Globe,
  service: Server,
  database: Database,
  cache: Zap,
  queue: ArrowLeftRight,
  monitoring: Activity,
  visualization: BarChart3,
};

const STATUS: Record<NodeStatus, { dot: string; label: string }> = {
  healthy: { dot: "bg-success", label: "Healthy" },
  warning: { dot: "bg-warning", label: "Warning" },
  critical: { dot: "bg-danger", label: "Critical" },
};

export default function CustomNode({ data, selected }: NodeProps) {
  const serviceType = data.serviceType as ServiceType;
  const nodeStatus = data.status as NodeStatus;
  const label = data.label as string;
  const highlighted = data.highlighted as boolean | undefined;
  const dimmed = data.dimmed as boolean | undefined;

  const Icon = ICONS[serviceType];
  const status = STATUS[nodeStatus];

  const borderClass = highlighted
    ? "border-danger shadow-[0_0_16px_rgba(239,68,68,0.3)]"
    : selected
      ? "border-accent shadow-[0_0_12px_rgba(59,130,246,0.2)]"
      : "border-edge hover:border-edge-hover";

  const opacityClass = dimmed ? "opacity-30" : "opacity-100";

  return (
    <>
      <Handle type="target" position={Position.Top} className="!bg-zinc-600 !border-none !w-2 !h-2" />

      <div className={`rounded-xl border bg-surface px-4 py-3 transition-all duration-200 ${borderClass} ${opacityClass}`} style={{ minWidth: 160 }}>
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-elevated">
            <Icon className="h-4 w-4 text-zinc-400" />
          </div>
          <div>
            <p className="text-[12px] font-semibold text-zinc-200">{label}</p>
            <div className="mt-0.5 flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
              <span className="text-[10px] text-zinc-500">{status.label}</span>
            </div>
          </div>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} className="!bg-zinc-600 !border-none !w-2 !h-2" />
    </>
  );
}
