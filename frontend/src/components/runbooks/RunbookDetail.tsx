import { X, AlertTriangle, Search, Wrench, CheckCircle, BookOpen, ExternalLink } from "lucide-react";
import Tag from "@/components/runbooks/Tag";
import { CATEGORY_COLORS } from "@/constants/runbooks";
import type { RunbookData, RunbookSeverity } from "@/types";

const SEVERITY_STYLE: Record<RunbookSeverity, string> = {
  Critical: "text-danger bg-danger/10",
  High: "text-amber-400 bg-amber-400/10",
  Medium: "text-blue-400 bg-blue-400/10",
  Low: "text-zinc-400 bg-zinc-700/30",
};

interface RunbookDetailProps {
  runbook: RunbookData;
  onClose: () => void;
}

export default function RunbookDetail({ runbook, onClose }: RunbookDetailProps) {
  const catColor = CATEGORY_COLORS[runbook.category];
  const sevStyle = SEVERITY_STYLE[runbook.severity];

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="relative flex w-full max-w-lg flex-col border-l border-edge bg-sidebar">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-edge px-6 py-4">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-zinc-100">{runbook.title}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Tag label={runbook.category} variant="category" color={catColor} />
              <span className={`rounded-md px-2 py-0.5 text-[11px] font-semibold ${sevStyle}`}>
                {runbook.severity}
              </span>
              <span className="text-[11px] text-zinc-600">{runbook.readingTime} min read</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-lg p-1.5 text-zinc-500 hover:bg-elevated hover:text-zinc-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* Description */}
          <p className="text-[13px] leading-relaxed text-zinc-400">{runbook.description}</p>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {runbook.tags.map((tag) => (
              <Tag key={tag} label={tag} />
            ))}
          </div>

          {/* Symptoms */}
          <Section icon={AlertTriangle} title="Symptoms" iconColor="text-amber-400">
            <ul className="space-y-1.5">
              {runbook.symptoms.map((s, i) => (
                <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-zinc-400">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600" />
                  {s}
                </li>
              ))}
            </ul>
          </Section>

          {/* Possible Causes */}
          <Section icon={Search} title="Possible Causes" iconColor="text-red-400">
            <ul className="space-y-1.5">
              {runbook.possibleCauses.map((c, i) => (
                <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-zinc-400">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-zinc-600" />
                  {c}
                </li>
              ))}
            </ul>
          </Section>

          {/* Resolution Steps */}
          <Section icon={Wrench} title="Resolution Steps" iconColor="text-blue-400">
            <ol className="space-y-2">
              {runbook.resolutionSteps.map((step, i) => (
                <li key={i} className="flex gap-2.5 text-[12px] leading-relaxed text-zinc-400">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md bg-elevated text-[10px] font-semibold text-zinc-500">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </Section>

          {/* Verification */}
          <Section icon={CheckCircle} title="Verification Steps" iconColor="text-emerald-400">
            <ul className="space-y-1.5">
              {runbook.verificationSteps.map((v, i) => (
                <li key={i} className="flex gap-2 text-[12px] leading-relaxed text-zinc-400">
                  <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-emerald-600" />
                  {v}
                </li>
              ))}
            </ul>
          </Section>

          {/* Related Runbooks */}
          <Section icon={BookOpen} title="Related Runbooks" iconColor="text-violet-400">
            <div className="space-y-1.5">
              {runbook.relatedRunbooks.map((rb) => (
                <div key={rb} className="flex items-center gap-2 rounded-lg border border-edge px-3 py-2 transition-colors hover:border-edge-hover">
                  <BookOpen className="h-3 w-3 flex-shrink-0 text-zinc-600" />
                  <span className="text-[12px] text-zinc-400">{rb}</span>
                </div>
              ))}
            </div>
          </Section>

          {/* References */}
          {runbook.references.length > 0 && (
            <Section icon={ExternalLink} title="References" iconColor="text-cyan-400">
              <div className="space-y-1.5">
                {runbook.references.map((ref) => (
                  <a
                    key={ref}
                    href={ref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 rounded-lg border border-edge px-3 py-2 text-[12px] text-accent transition-colors hover:border-accent/30 hover:bg-accent-muted"
                  >
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{ref}</span>
                  </a>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Reusable section wrapper ────────────────── */

interface SectionProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  iconColor: string;
  children: React.ReactNode;
}

function Section({ icon: Icon, title, iconColor, children }: SectionProps) {
  return (
    <div>
      <div className="mb-2.5 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <h4 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{title}</h4>
      </div>
      {children}
    </div>
  );
}
