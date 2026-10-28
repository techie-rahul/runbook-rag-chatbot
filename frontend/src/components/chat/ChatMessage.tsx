import { User, AlertCircle } from "lucide-react";
import AssistantResponse from "@/components/chat/AssistantResponse";
import MarkdownRenderer from "@/components/chat/MarkdownRenderer";
import SourcesPanel from "@/components/chat/SourcesPanel";
import EvidenceBadge from "@/components/chat/EvidenceBadge";
import type { ChatMessage as ChatMessageType } from "@/types";

interface ChatMessageProps {
  message: ChatMessageType;
}

export default function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  const timeString = message.timestamp.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="flex max-w-[85%] md:max-w-[75%] items-start gap-3">
          <div className="space-y-1">
            <div className="rounded-xl rounded-tr-sm bg-accent px-4 py-3 shadow-sm">
              <p className="text-[13px] leading-relaxed text-white">
                {message.content}
              </p>
            </div>
            <p className="text-right text-[10px] text-zinc-600">{timeString}</p>
          </div>
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-accent/20">
            <User className="h-3.5 w-3.5 text-accent" />
          </div>
        </div>
      </div>
    );
  }

  // ── Error state ────────────────────────────────
  if (message.isError) {
    return (
      <div className="flex max-w-[90%] md:max-w-[85%]">
        <div className="w-full space-y-1">
          <div className="flex items-center gap-2 pb-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/20">
              <AlertCircle className="h-3.5 w-3.5 text-red-400" />
            </div>
            <span className="text-[11px] font-medium text-zinc-500">OpsPilot</span>
            <span className="text-[10px] text-zinc-700">{timeString}</span>
          </div>
          <div className="rounded-xl rounded-tl-sm border border-red-500/30 bg-red-500/5 px-4 py-3.5 shadow-sm">
            <p className="text-[13px] leading-relaxed text-red-300">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Assistant message
  const hasSources = (message.sourceChunks && message.sourceChunks.length > 0) ||
                     (message.expandedViaGraph && message.expandedViaGraph.length > 0);
  const isLowConfidence = message.confident === false;

  return (
    <div className="flex max-w-[95%] md:max-w-[90%]">
      <div className="w-full space-y-1">
        {/* Assistant Header & Evidence Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1">
          <div className="flex items-center gap-2">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-muted border border-accent/20">
              <span className="text-[10px] font-bold text-accent">OP</span>
            </div>
            <span className="text-[11px] font-semibold text-zinc-400">OpsPilot</span>
            <span className="text-[10px] text-zinc-600">{timeString}</span>
          </div>

          {/* Show Evidence Grounding indicator for assistant answers */}
          <EvidenceBadge confident={message.confident} />
        </div>

        {message.analysis && message.sources ? (
          <AssistantResponse
            analysis={message.analysis}
            sources={message.sources}
          />
        ) : (
          <div className="space-y-1">
            {/* Answer bubble with Markdown rendering */}
            <div
              className={`rounded-xl rounded-tl-sm border px-4.5 py-3.5 shadow-sm transition-colors ${
                isLowConfidence
                  ? "border-amber-500/25 bg-amber-500/5"
                  : "border-edge bg-surface"
              }`}
            >
              <MarkdownRenderer content={message.content} />
            </div>

            {/* Runbook Sources & Graph Correlation Panel */}
            {hasSources && (
              <SourcesPanel
                sourceChunks={message.sourceChunks}
                expandedViaGraph={message.expandedViaGraph}
                graphEdgesUsed={message.graphEdgesUsed}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
