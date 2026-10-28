import { useLocation } from "react-router-dom";
import { Search, Bell } from "lucide-react";
import type { RouteConfig } from "@/types";

const ROUTES: RouteConfig[] = [
  { path: "/", title: "Chat", description: "Investigate incidents with AI" },
  { path: "/graph", title: "Dependency Graph", description: "Visualize service dependencies" },
  { path: "/runbooks", title: "Runbooks", description: "Browse operational runbooks" },
];

export default function Header() {
  const { pathname } = useLocation();
  const currentRoute = ROUTES.find((r) => r.path === pathname) ?? ROUTES[0];

  return (
    <header className="flex h-14 flex-shrink-0 items-center gap-4 border-b border-edge bg-sidebar px-6">
      {/* ── Page Title ─────────────────────────── */}
      <div className="flex items-center gap-3">
        <h1 className="text-[15px] font-semibold text-zinc-100">
          {currentRoute.title}
        </h1>
        <span className="hidden text-[13px] text-zinc-600 sm:inline">
          {currentRoute.description}
        </span>
      </div>

      {/* ── Search Bar ─────────────────────────── */}
      <div className="ml-auto flex max-w-md flex-1 items-center justify-center">
        <div className="flex w-full max-w-xs items-center gap-2 rounded-lg border border-edge bg-app px-3 py-1.5 transition-colors duration-150 hover:border-edge-hover">
          <Search className="h-3.5 w-3.5 flex-shrink-0 text-zinc-600" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-transparent text-[13px] text-zinc-300 placeholder-zinc-600 outline-none"
            readOnly
          />
          <kbd className="hidden flex-shrink-0 rounded border border-edge bg-elevated px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 sm:inline">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* ── Right Actions ──────────────────────── */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button
          className="relative rounded-lg p-2 text-zinc-500 transition-colors hover:bg-elevated hover:text-zinc-300"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-accent" />
        </button>

        {/* Profile Avatar */}
        <button
          className="flex h-8 w-8 items-center justify-center rounded-full bg-accent/20 text-[11px] font-semibold text-accent transition-colors hover:bg-accent/30"
          aria-label="Profile"
        >
          RD
        </button>
      </div>
    </header>
  );
}
