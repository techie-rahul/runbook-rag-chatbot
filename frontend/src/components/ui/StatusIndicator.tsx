import type { ServiceStatus } from "@/types";

interface StatusIndicatorProps {
  label: string;
  status: ServiceStatus;
}

const STATUS_CONFIG: Record<ServiceStatus, { color: string; bg: string }> = {
  online: {
    color: "bg-success",
    bg: "bg-success/20",
  },
  offline: {
    color: "bg-danger",
    bg: "bg-danger/20",
  },
  degraded: {
    color: "bg-warning",
    bg: "bg-warning/20",
  },
};

export default function StatusIndicator({ label, status }: StatusIndicatorProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-2.5 py-1">
      <span className={`relative flex h-2 w-2`}>
        {status === "online" && (
          <span
            className={`absolute inline-flex h-full w-full animate-ping rounded-full ${config.bg} opacity-75`}
          />
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${config.color}`} />
      </span>
      <span className="text-xs text-zinc-500">{label}</span>
    </div>
  );
}
