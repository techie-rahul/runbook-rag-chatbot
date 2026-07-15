import type { RunbookCategory } from "@/types";
import { ALL_CATEGORIES, CATEGORY_COLORS } from "@/constants/runbooks";


interface CategoryFilterProps {
  selected: RunbookCategory | null;
  onChange: (category: RunbookCategory | null) => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <button
        onClick={() => onChange(null)}
        className={`rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors ${
          selected === null
            ? "bg-accent/10 text-accent"
            : "text-zinc-500 hover:bg-elevated hover:text-zinc-300"
        }`}
      >
        All
      </button>
      {ALL_CATEGORIES.map((cat) => {
        const isActive = selected === cat;
        const color = CATEGORY_COLORS[cat];
        return (
          <button
            key={cat}
            onClick={() => onChange(isActive ? null : cat)}
            className="rounded-lg px-2.5 py-1 text-[12px] font-medium transition-colors"
            style={
              isActive
                ? { backgroundColor: `${color}18`, color }
                : undefined
            }
            // Non-active gets default zinc styling via className
            {...(!isActive && {
              className:
                "rounded-lg px-2.5 py-1 text-[12px] font-medium text-zinc-500 transition-colors hover:bg-elevated hover:text-zinc-300",
            })}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
