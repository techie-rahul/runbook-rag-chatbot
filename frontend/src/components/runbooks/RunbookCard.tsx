import { Clock, BookOpen } from "lucide-react";
import Tag from "@/components/runbooks/Tag";
import { CATEGORY_COLORS } from "@/components/runbooks/CategoryFilter";
import type { RunbookData, RunbookSeverity } from "@/types";

const SEVERITY_STYLE: Record<RunbookSeverity, string> = {
  Critical: "text-danger bg-danger/10",
  High: "text-amber-400 bg-amber-400/10",
  Medium: "text-blue-400 bg-blue-400/10",
  Low: "text-zinc-400 bg-zinc-700/30",
};

interface RunbookCardProps {
  runbook: RunbookData;
  onClick: () => void;
}

export default function RunbookCard({ runbook, onClick }: RunbookCardProps) {
  const catColor = CATEGORY_COLORS[runbook.category];
  const sevStyle = SEVERITY_STYLE[runbook.severity];

  return (
    <button
      onClick={onClick}
      className="group flex w-full flex-col rounded-xl border border-edge bg-surface p-4 text-left transition-all duration-150 hover:border-edge-hover hover:bg-elevated"
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-4 w-4 flex-shrink-0 text-zinc-600 group-hover:text-zinc-400" />
          <h3 className="text-[13px] font-semibold text-zinc-200 group-hover:text-zinc-100">
            {runbook.title}
          </h3>
        </div>
        <span className={`flex-shrink-0 rounded-md px-2 py-0.5 text-[10px] font-semibold ${sevStyle}`}>
          {runbook.severity}
        </span>
      </div>

      {/* Category badge */}
      <div className="mt-2">
        <Tag label={runbook.category} variant="category" color={catColor} />
      </div>

      {/* Description */}
      <p className="mt-2.5 line-clamp-2 text-[12px] leading-relaxed text-zinc-500">
        {runbook.description}
      </p>

      {/* Tags */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {runbook.tags.slice(0, 3).map((tag) => (
          <Tag key={tag} label={tag} />
        ))}
        {runbook.tags.length > 3 && (
          <Tag label={`+${runbook.tags.length - 3}`} />
        )}
      </div>

      {/* Footer */}
      <div className="mt-3 flex items-center gap-3 border-t border-edge pt-3 text-[11px] text-zinc-600">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {runbook.lastUpdated}
        </span>
        <span>·</span>
        <span>{runbook.readingTime} min read</span>
      </div>
    </button>
  );
}
