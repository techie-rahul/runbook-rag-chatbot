import { User } from "lucide-react";
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
          <div className="rounded-xl rounded-tl-sm border border-edge bg-surface px-4 py-3">
            <p className="text-[13px] leading-relaxed text-zinc-300">
              {message.content}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
