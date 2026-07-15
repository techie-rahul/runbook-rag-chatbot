import type { LucideIcon } from "lucide-react";

interface SuggestedPromptProps {
  icon: LucideIcon;
  title: string;
  onClick: () => void;
}

export default function SuggestedPrompt({ icon: Icon, title, onClick }: SuggestedPromptProps) {
  return (
    <button
      onClick={onClick}
      className="group flex items-start gap-3 rounded-xl border border-edge bg-surface p-4 text-left transition-colors duration-150 hover:border-edge-hover hover:bg-elevated"
    >
      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-accent-muted">
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <span className="text-[13px] leading-relaxed text-zinc-400 group-hover:text-zinc-300">
        {title}
      </span>
    </button>
  );
}
