import {
  AlertTriangle,
  Search,
  Wrench,
  Gauge,
  BookOpen,
  FileText,
} from "lucide-react";
import SourceCard from "@/components/chat/SourceCard";
import type { IncidentAnalysis, RetrievedSource } from "@/types";

interface AssistantResponseProps {
  analysis: IncidentAnalysis;
  sources: RetrievedSource[];
}

export default function AssistantResponse({ analysis, sources }: AssistantResponseProps) {
  const confidenceColor =
    analysis.confidence >= 85
      ? "text-success bg-success"
      : analysis.confidence >= 60
        ? "text-warning bg-warning"
        : "text-danger bg-danger";

  return (
    <div className="space-y-0 divide-y divide-edge rounded-xl border border-edge bg-surface">
      {/* Incident Summary */}
      <Section icon={AlertTriangle} title="Incident Summary" iconColor="text-amber-500">
        <p className="text-[13px] leading-relaxed text-zinc-300">
          {analysis.summary}
        </p>
      </Section>

      {/* Root Cause */}
      <Section icon={Search} title="Root Cause" iconColor="text-red-400">
        <p className="text-[13px] leading-relaxed text-zinc-300">
          {analysis.rootCause}
        </p>
      </Section>

      {/* Suggested Resolution */}
      <Section icon={Wrench} title="Suggested Resolution" iconColor="text-blue-400">
        <div className="space-y-1.5 text-[13px] leading-relaxed text-zinc-300">
          {analysis.suggestedResolution.split("\n").map((line, i) => {
            // Render markdown-like bold (**text**) as <strong>
            const parts = line.split(/(\*\*[^*]+\*\*)/g);
            return (
              <p key={i}>
                {parts.map((part, j) =>
                  part.startsWith("**") && part.endsWith("**") ? (
                    <strong key={j} className="font-semibold text-zinc-100">
                      {part.slice(2, -2)}
                    </strong>
                  ) : (
                    <span key={j}>{part}</span>
                  )
                )}
              </p>
            );
          })}
        </div>
      </Section>

      {/* Confidence Score */}
      <Section icon={Gauge} title="Confidence Score" iconColor="text-emerald-400">
        <div className="flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-800">
            <div
              className={`h-full rounded-full ${confidenceColor.split(" ")[1]}`}
              style={{ width: `${analysis.confidence}%` }}
            />
          </div>
          <span className={`text-sm font-semibold ${confidenceColor.split(" ")[0]}`}>
            {analysis.confidence}%
          </span>
        </div>
      </Section>

      {/* Retrieved Sources */}
      {sources.length > 0 && (
        <Section icon={FileText} title="Retrieved Sources" iconColor="text-violet-400">
          <div className="space-y-2">
            {sources.map((source) => (
              <SourceCard key={source.id} source={source} />
            ))}
          </div>
        </Section>
      )}

      {/* Related Runbooks */}
      {analysis.relatedRunbooks.length > 0 && (
        <Section icon={BookOpen} title="Related Runbooks" iconColor="text-cyan-400">
          <div className="flex flex-wrap gap-2">
            {analysis.relatedRunbooks.map((rb) => (
              <span
                key={rb.id}
                className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-app px-3 py-1.5 text-[12px] text-zinc-400 transition-colors hover:border-edge-hover hover:text-zinc-300"
              >
                <BookOpen className="h-3 w-3" />
                {rb.title}
                <span className="rounded bg-elevated px-1.5 py-0.5 text-[10px] text-zinc-600">
                  {rb.category}
                </span>
              </span>
            ))}
          </div>
        </Section>
      )}
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
    <div className="px-4 py-4">
      <div className="mb-2.5 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${iconColor}`} />
        <h4 className="text-[12px] font-semibold uppercase tracking-wider text-zinc-500">
          {title}
        </h4>
      </div>
      {children}
    </div>
  );
}
