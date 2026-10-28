import { useState, useCallback } from "react";
import { Check, Copy, Terminal } from "lucide-react";

interface CodeBlockProps {
  language?: string;
  value: string;
}

export default function CodeBlock({ language, value }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const cleanValue = value.replace(/\n$/, "");

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cleanValue);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for clipboard write failure
      const textArea = document.createElement("textarea");
      textArea.value = cleanValue;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [cleanValue]);

  const displayLanguage = language || "bash";

  return (
    <div className="group relative my-3 overflow-hidden rounded-lg border border-edge bg-elevated/70 shadow-sm transition-colors duration-150 hover:border-edge-hover">
      {/* Code Header Bar */}
      <div className="flex items-center justify-between border-b border-edge bg-surface/80 px-3.5 py-1.5 text-xs">
        <div className="flex items-center gap-1.5 text-zinc-400">
          <Terminal className="h-3.5 w-3.5 text-accent" />
          <span className="font-mono text-[11px] font-medium uppercase tracking-wide text-zinc-400">
            {displayLanguage}
          </span>
        </div>
        <button
          onClick={handleCopy}
          type="button"
          className="flex items-center gap-1.5 rounded px-2 py-0.5 text-[11px] font-medium text-zinc-400 transition-colors hover:bg-elevated hover:text-zinc-200"
          title="Copy command to clipboard"
          aria-label="Copy code to clipboard"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5 text-zinc-500 transition-colors group-hover:text-zinc-300" />
              <span className="text-zinc-500 transition-colors group-hover:text-zinc-300">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="overflow-x-auto p-3.5 text-[12.5px] leading-relaxed">
        <pre className="font-mono text-zinc-200">
          <code>{cleanValue}</code>
        </pre>
      </div>
    </div>
  );
}
