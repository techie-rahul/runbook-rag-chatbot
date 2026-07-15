import { useState, useMemo } from "react";
import { ArrowUpDown } from "lucide-react";
import RunbookSearch from "@/components/runbooks/RunbookSearch";
import CategoryFilter from "@/components/runbooks/CategoryFilter";
import RunbookCard from "@/components/runbooks/RunbookCard";
import RunbookDetail from "@/components/runbooks/RunbookDetail";
import { mockRunbooks } from "@/data/mockRunbooks";
import type { RunbookCategory, RunbookData } from "@/types";

type SortKey = "title" | "updated" | "severity";

const SEVERITY_ORDER = { Critical: 0, High: 1, Medium: 2, Low: 3 } as const;

export default function Runbooks() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<RunbookCategory | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("updated");
  const [selectedRunbook, setSelectedRunbook] = useState<RunbookData | null>(null);

  // ── Filter & sort ─────────────────────────────
  const filteredRunbooks = useMemo(() => {
    const query = search.toLowerCase();

    let results = mockRunbooks.filter((rb) => {
      // Category filter
      if (category && rb.category !== category) return false;

      // Search filter
      if (query) {
        const searchable = [
          rb.title,
          rb.category,
          rb.description,
          ...rb.tags,
        ].join(" ").toLowerCase();
        return searchable.includes(query);
      }

      return true;
    });

    // Sort
    results = [...results].sort((a, b) => {
      switch (sortBy) {
        case "title":
          return a.title.localeCompare(b.title);
        case "severity":
          return SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity];
        case "updated":
        default:
          return 0; // Keep original order (already sorted by recency in mock data)
      }
    });

    return results;
  }, [search, category, sortBy]);

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Page header */}
        <div className="flex-shrink-0 pb-4">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Runbook Library</h1>
          <p className="mt-1 text-[13px] text-zinc-500">
            Browse operational runbooks used by the AI knowledge base.
          </p>
        </div>

        {/* Search + Sort */}
        <div className="flex-shrink-0 space-y-3 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <RunbookSearch
                value={search}
                onChange={setSearch}
                resultCount={filteredRunbooks.length}
              />
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <div className="flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-3 py-2">
                <ArrowUpDown className="h-3.5 w-3.5 text-zinc-600" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortKey)}
                  className="bg-transparent text-[12px] text-zinc-400 outline-none"
                >
                  <option value="updated">Recently Updated</option>
                  <option value="title">Title A–Z</option>
                  <option value="severity">Severity</option>
                </select>
              </div>
            </div>
          </div>

          {/* Category filter */}
          <CategoryFilter selected={category} onChange={setCategory} />
        </div>

        {/* Runbook grid */}
        <div className="min-h-0 flex-1 overflow-y-auto">
          {filteredRunbooks.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 pb-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredRunbooks.map((rb) => (
                <RunbookCard
                  key={rb.id}
                  runbook={rb}
                  onClick={() => setSelectedRunbook(rb)}
                />
              ))}
            </div>
          ) : (
            <div className="flex h-64 items-center justify-center">
              <div className="text-center">
                <p className="text-[14px] font-medium text-zinc-400">No runbooks found</p>
                <p className="mt-1 text-[12px] text-zinc-600">
                  Try adjusting your search or category filter.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Detail drawer */}
      {selectedRunbook && (
        <RunbookDetail
          runbook={selectedRunbook}
          onClose={() => setSelectedRunbook(null)}
        />
      )}
    </>
  );
}