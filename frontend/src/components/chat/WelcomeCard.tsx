import { Zap, Container, Server, Layers, HelpCircle } from "lucide-react";
import SuggestedPrompt from "@/components/chat/SuggestedPrompt";

const SUGGESTIONS = [
  {
    icon: Container,
    title: "My pod is in CrashLoopBackOff.",
  },
  {
    icon: Server,
    title: "The Kubernetes API server is returning 5xx errors.",
  },
  {
    icon: Layers,
    title: "Pods are not getting scheduled due to capacity limits.",
  },
  {
    icon: HelpCircle,
    title: "Analyze a Redis timeout.",
  },
] as const;

interface WelcomeCardProps {
  onSelectPrompt: (prompt: string) => void;
}

export default function WelcomeCard({ onSelectPrompt }: WelcomeCardProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-10">
      {/* Logo */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-edge bg-surface shadow-sm">
        <Zap className="h-7 w-7 text-accent" />
      </div>

      {/* Heading */}
      <h2 className="mt-4 text-xl font-bold tracking-tight text-zinc-100">
        OpsPilot Incident Investigation
      </h2>
      <p className="mt-1.5 max-w-md text-center text-[13px] leading-relaxed text-zinc-400">
        AI Site Reliability Assistant grounded in Kubernetes operational runbooks and one-hop cluster dependency graphs.
      </p>

      {/* RAG pipeline badges */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        <span className="rounded-md border border-edge bg-elevated px-2.5 py-1 text-[11px] font-medium text-zinc-400">
          ChromaDB (Vector Search)
        </span>
        <span className="rounded-md border border-edge bg-elevated px-2.5 py-1 text-[11px] font-medium text-zinc-400">
          NetworkX (Knowledge Graph)
        </span>
        <span className="rounded-md border border-edge bg-elevated px-2.5 py-1 text-[11px] font-medium text-zinc-400">
          Groq / Qwen (Evidence Grounded)
        </span>
      </div>

      {/* Suggestion Grid */}
      <div className="mt-7 grid w-full grid-cols-1 gap-2.5 sm:grid-cols-2">
        {SUGGESTIONS.map((s) => (
          <SuggestedPrompt
            key={s.title}
            icon={s.icon}
            title={s.title}
            onClick={() => onSelectPrompt(s.title)}
          />
        ))}
      </div>
    </div>
  );
}
