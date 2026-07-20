import { useState, useRef, useEffect, useCallback } from "react";
import WelcomeCard from "@/components/chat/WelcomeCard";
import ChatMessage from "@/components/chat/ChatMessage";
import ChatInput from "@/components/chat/ChatInput";
import TypingIndicator from "@/components/chat/TypingIndicator";
import type { ChatMessage as ChatMessageType } from "@/types";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hasMessages = messages.length > 0;

  // Auto-scroll to bottom when messages change or loading state changes
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  // ── Send message handler ──────────────────────
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMessage: ChatMessageType = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });

      if (!res.ok) {
        throw new Error(`Server error: ${res.status}`);
      }

      const data = await res.json();

      const assistantMessage: ChatMessageType = {
        id: `asst-${Date.now()}`,
        role: "assistant",
        content: data.answer,
        timestamp: new Date(),
        confident: data.confident,
        sourceChunks: data.source_chunks,
        expandedViaGraph: data.expanded_via_graph,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage: ChatMessageType = {
        id: `err-${Date.now()}`,
        role: "assistant",
        content:
          err instanceof Error
            ? `Failed to reach the backend: ${err.message}`
            : "An unexpected error occurred. Is the backend running on port 8000?",
        timestamp: new Date(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading]);

  // ── Select suggested prompt ───────────────────
  const handleSelectPrompt = useCallback((prompt: string) => {
    setInput(prompt);
  }, []);

  return (
    <div className="flex h-full flex-col">
      {/* Page Header */}
      <div className="flex-shrink-0 pb-4">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-100">
          AI Incident Investigation
        </h1>
        <p className="mt-1 text-[13px] text-zinc-500">
          Ask infrastructure questions or upload logs to receive AI-powered incident analysis.
        </p>
      </div>

      {/* Message Area */}
      <div className="min-h-0 flex-1 overflow-y-auto">
        {!hasMessages ? (
          <WelcomeCard onSelectPrompt={handleSelectPrompt} />
        ) : (
          <div className="mx-auto max-w-3xl space-y-6 pb-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Chat Input — sticky bottom */}
      <div className="flex-shrink-0">
        <ChatInput
          value={input}
          onChange={setInput}
          onSend={handleSend}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}