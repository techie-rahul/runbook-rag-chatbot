import { NavLink } from "react-router-dom";
import { Zap, MessageSquare, Network, BookOpen } from "lucide-react";
import StatusIndicator from "@/components/ui/StatusIndicator";
import type { ServiceHealth } from "@/types";

const NAV_ITEMS = [
  { label: "Chat", path: "/", icon: MessageSquare },
  { label: "Dependency Graph", path: "/graph", icon: Network },
  { label: "Runbooks", path: "/runbooks", icon: BookOpen },
] as const;

const SYSTEM_STATUS: ServiceHealth[] = [
  { label: "Backend", status: "online" },
  { label: "Vector DB", status: "online" },
  { label: "LLM", status: "online" },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-shrink-0 flex-col border-r border-edge bg-sidebar">
      {/* ── Brand ──────────────────────────────── */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-accent-muted">
            <Zap className="h-4 w-4 text-accent" />
          </div>
          <span className="text-[15px] font-semibold tracking-tight text-zinc-100">
            OpsPilot
          </span>
        </div>
        <p className="mt-2 pl-0.5 text-[11px] font-medium uppercase tracking-widest text-zinc-600">
          AI Copilot for Incident Resolution
        </p>
      </div>

      {/* ── Navigation ─────────────────────────── */}
      <nav className="flex-1 space-y-0.5 px-3 pt-2">
        {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/"}
            className={({ isActive }) =>
              [
                "group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors duration-150",
                isActive
                  ? "bg-accent-muted text-zinc-100"
                  : "text-zinc-500 hover:bg-elevated hover:text-zinc-300",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`h-4 w-4 flex-shrink-0 ${
                    isActive ? "text-accent" : "text-zinc-600 group-hover:text-zinc-400"
                  }`}
                />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* ── System Status ──────────────────────── */}
      <div className="border-t border-edge px-5 py-4">
        <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-700">
          System
        </p>
        {SYSTEM_STATUS.map((service) => (
          <StatusIndicator
            key={service.label}
            label={service.label}
            status={service.status}
          />
        ))}
      </div>
    </aside>
  );
}
