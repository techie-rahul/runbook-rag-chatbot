import { Zap, Container, Timer, Globe, Database } from "lucide-react";
import SuggestedPrompt from "@/components/chat/SuggestedPrompt";

const SUGGESTIONS = [
  {
    icon: Container,
    title: "Investigate a Kubernetes CrashLoopBackOff",
  },
  {
    icon: Timer,
    title: "Analyze a Redis timeout",
  },
  {
    icon: Globe,
    title: "Find the root cause of HTTP 502 errors",
  },
  {
    icon: Database,
    title: "Explain database connection failures",
  },
] as const;

interface WelcomeCardProps {
  onSelectPrompt: (prompt: string) => void;
}

export default function WelcomeCard({ onSelectPrompt }: WelcomeCardProps) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-12">
      {/* Logo */}
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-edge bg-surface">
        <Zap className="h-7 w-7 text-accent" />
      </div>

      {/* Heading */}
      <h2 className="mt-5 text-xl font-semibold text-zinc-100">
        How can I help you investigate?
      </h2>
      <p className="mt-2 max-w-md text-center text-[13px] leading-relaxed text-zinc-500">
        Describe your infrastructure issue or paste error logs. I'll retrieve relevant
        runbooks and provide a structured incident analysis.
      </p>

      {/* Retrieval badges */}
      <div className="mt-5 flex items-center gap-2">
        {["ChromaDB", "BM25", "GraphRAG"].map((method) => (
          <span
            key={method}
            className="rounded-md border border-edge bg-elevated px-2 py-0.5 text-[10px] font-medium text-zinc-500"
          >
            {method}
          </span>
        ))}
      </div>

      {/* Suggestion Grid */}
      <div className="mt-8 grid w-full grid-cols-1 gap-3 sm:grid-cols-2">
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
