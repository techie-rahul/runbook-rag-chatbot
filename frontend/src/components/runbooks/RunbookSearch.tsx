import { Search } from "lucide-react";

interface RunbookSearchProps {
  value: string;
  onChange: (value: string) => void;
  resultCount: number;
}

export default function RunbookSearch({ value, onChange, resultCount }: RunbookSearchProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-1 items-center gap-2 rounded-lg border border-edge bg-surface px-3 py-2 transition-colors focus-within:border-accent/40">
        <Search className="h-4 w-4 flex-shrink-0 text-zinc-600" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search runbooks by title, tags, or description..."
          className="w-full bg-transparent text-[13px] text-zinc-200 placeholder-zinc-600 outline-none"
        />
        {value && (
          <button
            onClick={() => onChange("")}
            className="flex-shrink-0 text-[11px] text-zinc-600 hover:text-zinc-400"
          >
            Clear
          </button>
        )}
      </div>
      <span className="flex-shrink-0 text-[12px] text-zinc-600">
        {resultCount} runbook{resultCount !== 1 ? "s" : ""}
      </span>
    </div>
  );
}
