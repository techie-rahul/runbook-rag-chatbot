import { User, AlertCircle, ShieldAlert } from "lucide-react";
import AssistantResponse from "@/components/chat/AssistantResponse";
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
        <div className="flex max-w-[75%] items-start gap-3">
          <div className="space-y-1">
            <div className="rounded-xl rounded-tr-sm bg-accent px-4 py-3">
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
      <div className="flex max-w-[85%]">
        <div className="space-y-1">
          <div className="flex items-center gap-2 pb-1">
            <div className="flex h-6 w-6 items-center justify-center rounded-md bg-red-500/20">
              <AlertCircle className="h-3.5 w-3.5 text-red-400" />
            </div>
            <span className="text-[11px] font-medium text-zinc-500">OpsPilot</span>
            <span className="text-[10px] text-zinc-700">{timeString}</span>
          </div>
          <div className="rounded-xl rounded-tl-sm border border-red-500/30 bg-red-500/5 px-4 py-3">
            <p className="text-[13px] leading-relaxed text-red-300">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Low-confidence indicator ───────────────────
  const isLowConfidence = message.confident === false;

  // Assistant message
  return (
    <div className="flex max-w-[85%]">
      <div className="space-y-1">
        <div className="flex items-center gap-2 pb-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-muted">
            <span className="text-[10px] font-bold text-accent">OP</span>
          </div>
          <span className="text-[11px] font-medium text-zinc-500">OpsPilot</span>
          <span className="text-[10px] text-zinc-700">{timeString}</span>
        </div>

        {message.analysis && message.sources ? (
          <AssistantResponse
            analysis={message.analysis}
            sources={message.sources}
          />
        ) : (
          <div className="space-y-2">
            {/* Low-confidence warning banner */}
            {isLowConfidence && (
              <div className="flex items-center gap-2 rounded-lg border border-amber-500/20 bg-amber-500/5 px-3 py-2">
                <ShieldAlert className="h-3.5 w-3.5 flex-shrink-0 text-amber-400" />
                <span className="text-[11px] text-amber-400/80">
                  Low confidence — the AI could not find a strong match in the runbooks.
                </span>
              </div>
            )}

            {/* Answer bubble */}
            <div
              className={`rounded-xl rounded-tl-sm border px-4 py-3 ${
                isLowConfidence
                  ? "border-amber-500/20 bg-amber-500/5"
                  : "border-edge bg-surface"
              }`}
            >
              <p
                className={`whitespace-pre-wrap text-[13px] leading-relaxed ${
                  isLowConfidence ? "text-zinc-400" : "text-zinc-300"
                }`}
              >
                {message.content}
              </p>
            </div>

            {/* Source chunks badges */}
            {message.sourceChunks && message.sourceChunks.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Sources
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {message.sourceChunks.map((chunk, i) => (
                    <span
                      key={i}
                      className="inline-block max-w-xs truncate rounded-md border border-edge bg-app px-2 py-1 text-[11px] text-zinc-400"
                      title={chunk}
                    >
                      {chunk}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Graph-expanded runbooks */}
            {message.expandedViaGraph && message.expandedViaGraph.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-600">
                  Expanded via graph
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {message.expandedViaGraph.map((title, i) => (
                    <span
                      key={i}
                      className="inline-block rounded-md border border-cyan-500/20 bg-cyan-500/5 px-2 py-1 text-[11px] text-cyan-400"
                    >
                      {title}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

