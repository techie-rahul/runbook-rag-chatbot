import { useState } from "react";
import { BookOpen, Network, ChevronDown, ChevronUp, ArrowRight } from "lucide-react";

interface SourcesPanelProps {
  sourceChunks?: string[];
  expandedViaGraph?: string[];
  graphEdgesUsed?: string[];
}

export default function SourcesPanel({
  sourceChunks = [],
  expandedViaGraph = [],
  graphEdgesUsed = [],
}: SourcesPanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const hasPrimary = sourceChunks && sourceChunks.length > 0;
  const hasGraph = expandedViaGraph && expandedViaGraph.length > 0;

  if (!hasPrimary && !hasGraph) {
    return null;
  }

  const totalSourcesCount = (sourceChunks?.length || 0) + (expandedViaGraph?.length || 0);

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-edge bg-surface/60 transition-colors">
      {/* Header Toggle */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-3.5 py-2 text-left text-xs font-medium text-zinc-400 transition-colors hover:bg-elevated/50 hover:text-zinc-200"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <BookOpen className="h-3.5 w-3.5 text-accent" />
          <span>Runbook Evidence & Knowledge Graph</span>
          <span className="rounded-full bg-elevated px-1.5 py-0.2 text-[10px] text-zinc-400">
            {totalSourcesCount}
          </span>
          {hasGraph && (
            <span className="flex items-center gap-1 rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] text-cyan-400">
              <Network className="h-2.5 w-2.5" />
              Graph Expanded
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="h-3.5 w-3.5 text-zinc-500" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5 text-zinc-500" />
        )}
      </button>

      {/* Expanded Content */}
      {isOpen && (
        <div className="space-y-3 border-t border-edge/80 p-3.5 text-xs">
          {/* Primary Evidence */}
          {hasPrimary && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-zinc-500">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                Primary Runbook Sections (Vector Search)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {sourceChunks.map((chunk, i) => (
                  <span
                    key={i}
                    className="inline-flex max-w-sm items-center gap-1.5 rounded-md border border-edge bg-app px-2.5 py-1 text-[11px] text-zinc-300 shadow-sm"
                    title={chunk}
                  >
                    <BookOpen className="h-3 w-3 flex-shrink-0 text-accent/80" />
                    <span className="truncate">{chunk}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Graph-Expanded Evidence */}
          {hasGraph && (
            <div>
              <p className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-cyan-400/90">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Graph-Expanded Dependencies (One-Hop Topology)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {expandedViaGraph.map((title, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 rounded-md border border-cyan-500/25 bg-cyan-500/10 px-2.5 py-1 text-[11px] font-medium text-cyan-300 shadow-sm"
                  >
                    <Network className="h-3 w-3 text-cyan-400" />
                    <span>{title}</span>
                  </span>
                ))}
              </div>

              {/* Edge Traversal Details */}
              {graphEdgesUsed && graphEdgesUsed.length > 0 && (
                <div className="mt-2 space-y-1 rounded border border-edge/60 bg-app/50 p-2 text-[10.5px] text-zinc-400">
                  <p className="font-medium text-zinc-500">Traversed Graph Relationships:</p>
                  <div className="space-y-0.5 font-mono">
                    {graphEdgesUsed.map((edge, i) => {
                      const [fromNode, toNode] = edge.split(" -> ");
                      return (
                        <div key={i} className="flex items-center gap-1.5 text-zinc-400">
                          <span className="text-zinc-300">{fromNode || edge}</span>
                          <ArrowRight className="h-2.5 w-2.5 text-cyan-500" />
                          <span className="text-cyan-400">{toNode || ""}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
