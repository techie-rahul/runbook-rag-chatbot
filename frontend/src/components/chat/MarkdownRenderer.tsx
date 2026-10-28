import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Activity,
  Terminal,
  AlertTriangle,
  ShieldCheck,
  BookOpen,
} from "lucide-react";
import CodeBlock from "./CodeBlock";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

// Clean unneeded backslash escapes from model outputs without altering code blocks
function preprocessMarkdown(raw: string): string {
  if (!raw) return "";

  // Split by code blocks to avoid mangling code
  const parts = raw.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, index) => {
      // Even indexes are outside fenced code blocks
      if (index % 2 === 0) {
        return part
          .replace(/\\([*_`~])/g, "$1") // Unescape bold/italic/code delimiters
          .replace(/\\-/g, "-")
          .replace(/\\\./g, ".")
          .replace(/<\/?(?:details|summary)>/gi, ""); // Clean raw HTML details/summary
      }
      return part;
    })
    .join("");
}

// Helper to identify SRE section headers
function getSRESectionMeta(title: string): {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  badgeBg: string;
} | null {
  const lower = title.toLowerCase();
  if (lower.includes("1. assessment") || lower.includes("assessment")) {
    return {
      icon: Activity,
      color: "text-cyan-400",
      badgeBg: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
    };
  }
  if (lower.includes("2. diagnostic") || lower.includes("diagnostic steps")) {
    return {
      icon: Terminal,
      color: "text-blue-400",
      badgeBg: "bg-blue-500/10 border-blue-500/30 text-blue-300",
    };
  }
  if (lower.includes("3. likely causes") || lower.includes("likely causes")) {
    return {
      icon: AlertTriangle,
      color: "text-amber-400",
      badgeBg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
    };
  }
  if (lower.includes("4. safest next action") || lower.includes("next action")) {
    return {
      icon: ShieldCheck,
      color: "text-emerald-400",
      badgeBg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
    };
  }
  if (lower.includes("5. grounded evidence") || lower.includes("evidence & sources") || lower.includes("sources")) {
    return {
      icon: BookOpen,
      color: "text-violet-400",
      badgeBg: "bg-violet-500/10 border-violet-500/30 text-violet-300",
    };
  }
  return null;
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  const processedContent = useMemo(() => preprocessMarkdown(content), [content]);

  return (
    <div className={`markdown-body text-[13px] leading-relaxed text-zinc-300 ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings with visual scanning polish
          h1: ({ children }) => (
            <h1 className="mt-5 mb-2.5 text-base font-bold text-zinc-100 first:mt-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => {
            const textContent = String(children);
            const sreMeta = getSRESectionMeta(textContent);
            if (sreMeta) {
              const Icon = sreMeta.icon;
              return (
                <div className="mt-5 mb-2 flex items-center gap-2 border-b border-edge/80 pb-1.5 first:mt-0">
                  <span className={`flex h-5 w-5 items-center justify-center rounded ${sreMeta.badgeBg}`}>
                    <Icon className={`h-3.5 w-3.5 ${sreMeta.color}`} />
                  </span>
                  <h2 className="text-[13.5px] font-semibold tracking-tight text-zinc-100">
                    {children}
                  </h2>
                </div>
              );
            }
            return (
              <h2 className="mt-4 mb-2 text-sm font-semibold text-zinc-100 first:mt-0">
                {children}
              </h2>
            );
          },
          h3: ({ children }) => {
            const textContent = String(children);
            const sreMeta = getSRESectionMeta(textContent);
            if (sreMeta) {
              const Icon = sreMeta.icon;
              return (
                <div className="mt-5 mb-2 flex items-center gap-2 border-b border-edge/80 pb-1.5 first:mt-0">
                  <span className={`flex h-5 w-5 items-center justify-center rounded border ${sreMeta.badgeBg}`}>
                    <Icon className={`h-3 w-3 ${sreMeta.color}`} />
                  </span>
                  <h3 className="text-[13px] font-semibold tracking-tight text-zinc-100">
                    {children}
                  </h3>
                </div>
              );
            }
            return (
              <h3 className="mt-3.5 mb-1.5 text-[12.5px] font-semibold text-zinc-200 first:mt-0">
                {children}
              </h3>
            );
          },
          h4: ({ children }) => (
            <h4 className="mt-3 mb-1 text-[12px] font-semibold uppercase tracking-wider text-zinc-400 first:mt-0">
              {children}
            </h4>
          ),

          // Paragraphs
          p: ({ children }) => (
            <p className="my-2 leading-relaxed text-zinc-300 last:mb-0">
              {children}
            </p>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="my-2 ml-4 list-disc space-y-1 text-zinc-300 marker:text-zinc-500">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="my-2 ml-4 list-decimal space-y-1.5 text-zinc-300 marker:font-mono marker:text-[11px] marker:text-zinc-500">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-1 leading-relaxed text-zinc-300">
              {children}
            </li>
          ),

          // Fenced Code Blocks (react-markdown wraps code blocks in <pre>)
          pre: ({ children }: React.ComponentPropsWithoutRef<"pre">) => {
            if (React.isValidElement<{ className?: string; children?: React.ReactNode }>(children)) {
              const codeProps = children.props;
              const className = codeProps.className || "";
              const match = /language-(\w+)/.exec(className);
              const value = String(codeProps.children || "");
              return (
                <CodeBlock
                  language={match ? match[1] : undefined}
                  value={value}
                />
              );
            }
            return <div className="my-3">{children}</div>;
          },

          // Inline Code (standalone <code> outside <pre>)
          code: ({ children, ...props }: React.ComponentPropsWithoutRef<"code">) => {
            return (
              <code
                className="rounded border border-edge bg-elevated/90 px-1.5 py-0.5 font-mono text-[11.5px] text-accent/95"
                {...props}
              >
                {children}
              </code>
            );
          },

          // Blockquote (for Phase 2 fallback or incident notices)
          blockquote: ({ children }) => (
            <blockquote className="my-3 rounded-r-lg border-l-2 border-amber-500/50 bg-amber-500/5 px-3.5 py-2.5 text-[12.5px] text-amber-200/90 shadow-sm">
              {children}
            </blockquote>
          ),

          // Tables
          table: ({ children }) => (
            <div className="my-3 overflow-x-auto rounded-lg border border-edge bg-elevated/30">
              <table className="w-full text-left text-[12px] text-zinc-300">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="border-b border-edge bg-surface/80 font-medium text-zinc-200">
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className="divide-y divide-edge/40">
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className="transition-colors hover:bg-elevated/50">
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 font-semibold text-zinc-200">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-zinc-300">
              {children}
            </td>
          ),

          // Typography emphasis
          strong: ({ children }) => (
            <strong className="font-semibold text-zinc-100">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-zinc-200">
              {children}
            </em>
          ),
          hr: () => <hr className="my-4 border-edge" />,
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}
