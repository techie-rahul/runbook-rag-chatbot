import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import type { RetrievedSource } from "@/types";

interface SourceCardProps {
  source: RetrievedSource;
}

export default function SourceCard({ source }: SourceCardProps) {
  const [expanded, setExpanded] = useState(false);
  const scorePercent = Math.round(source.relevanceScore * 100);

  return (
    <div className="rounded-lg border border-edge bg-app transition-colors hover:border-edge-hover">
      {/* Header — always visible */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left"
      >
        <FileText className="h-4 w-4 flex-shrink-0 text-zinc-600" />

        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] font-medium text-zinc-300">
            {source.title}
          </p>
          <p className="mt-0.5 truncate text-[11px] text-zinc-600">
            {source.category}
          </p>
        </div>

        {/* Relevance score */}
        <div className="flex flex-shrink-0 items-center gap-2">
          <div className="hidden items-center gap-1.5 sm:flex">
            <div className="h-1 w-16 overflow-hidden rounded-full bg-zinc-800">
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${scorePercent}%` }}
              />
            </div>
            <span className="text-[11px] font-medium text-zinc-500">
              {scorePercent}%
            </span>
          </div>
          <ChevronDown
            className={`h-3.5 w-3.5 text-zinc-600 transition-transform duration-200 ${
              expanded ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-edge px-3 py-2.5">
          <p className="text-[12px] leading-relaxed text-zinc-400">
            {source.snippet}
          </p>
          {source.content && (
            <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
              {source.content}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
