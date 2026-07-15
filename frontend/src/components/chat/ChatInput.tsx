import { useRef, useCallback } from "react";
import { SendHorizonal, Paperclip } from "lucide-react";

interface ChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  isLoading: boolean;
}

export default function ChatInput({ value, onChange, onSend, isLoading }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
    adjustHeight();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim() && !isLoading) {
        onSend();
        // Reset height after send
        requestAnimationFrame(() => {
          if (textareaRef.current) {
            textareaRef.current.style.height = "auto";
          }
        });
      }
    }
  };

  const canSend = value.trim().length > 0 && !isLoading;

  return (
    <div className="border-t border-edge bg-sidebar px-4 py-3">
      <div className="mx-auto flex max-w-3xl items-end gap-2 rounded-xl border border-edge bg-surface px-3 py-2 transition-colors focus-within:border-accent/40">
        {/* Upload Log Button (UI only) */}
        <button
          className="mb-0.5 flex-shrink-0 rounded-lg p-1.5 text-zinc-600 transition-colors hover:bg-elevated hover:text-zinc-400"
          aria-label="Upload log file"
          title="Upload log file"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        {/* Auto-resizing textarea */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Describe an incident or paste error logs..."
          rows={1}
          disabled={isLoading}
          className="max-h-40 min-h-[24px] flex-1 resize-none bg-transparent text-[13px] leading-relaxed text-zinc-200 placeholder-zinc-600 outline-none disabled:opacity-50"
        />

        {/* Send button */}
        <button
          onClick={onSend}
          disabled={!canSend}
          className={`mb-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg transition-colors ${
            canSend
              ? "bg-accent text-white hover:bg-accent-hover"
              : "bg-elevated text-zinc-600"
          }`}
          aria-label="Send message"
        >
          <SendHorizonal className="h-4 w-4" />
        </button>
      </div>

      <p className="mt-1.5 text-center text-[10px] text-zinc-700">
        Press Enter to send · Shift + Enter for new line
      </p>
    </div>
  );
}
