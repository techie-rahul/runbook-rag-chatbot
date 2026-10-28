import { ShieldCheck, ShieldAlert, Info } from "lucide-react";

interface EvidenceBadgeProps {
  confident?: boolean;
}

export default function EvidenceBadge({ confident }: EvidenceBadgeProps) {
  if (confident === undefined) return null;

  if (confident) {
    return (
      <div className="group relative inline-flex items-center gap-1.5 rounded-md border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
        <ShieldCheck className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
        <span>Evidence Grounded</span>
        <div className="flex items-center text-emerald-400/60">
          <Info className="h-3 w-3" />
        </div>

        {/* Hover Explanatory Tooltip */}
        <div className="pointer-events-none absolute bottom-full left-0 z-30 mb-1.5 hidden w-64 rounded-lg border border-edge bg-overlay p-2 text-[11px] leading-normal text-zinc-300 shadow-xl group-hover:block">
          <p className="font-semibold text-emerald-400">High Evidence Match</p>
          <p className="mt-0.5 text-zinc-400">
            Retrieved runbook sections strongly match this incident. Always execute recommended diagnostic checks before taking remediation action.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group relative inline-flex items-center gap-1.5 rounded-md border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-400">
      <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
      <span>Limited Grounding</span>
      <div className="flex items-center text-amber-400/60">
        <Info className="h-3 w-3" />
      </div>

      {/* Hover Explanatory Tooltip */}
      <div className="pointer-events-none absolute bottom-full left-0 z-30 mb-1.5 hidden w-64 rounded-lg border border-edge bg-overlay p-2 text-[11px] leading-normal text-zinc-300 shadow-xl group-hover:block">
        <p className="font-semibold text-amber-400">Partial or Out-of-Scope Evidence</p>
        <p className="mt-0.5 text-zinc-400">
          Runbook coverage for this query is partial or outside available cluster runbooks. Guidance reflects limited grounding.
        </p>
      </div>
    </div>
  );
}
