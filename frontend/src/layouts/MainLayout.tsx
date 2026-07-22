import { Outlet } from "react-router-dom";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

/**
 * Application shell — fixed sidebar + header + scrollable content.
 *
 * Layout structure:
 * ┌──────────┬──────────────────────────────────┐
 * │          │            Header                 │
 * │ Sidebar  ├──────────────────────────────────┤
 * │ (fixed)  │          Content Area             │
 * │          │          (scrollable)             │
 * └──────────┴──────────────────────────────────┘
 */
export default function MainLayout() {
  return (
    <div className="flex h-screen overflow-hidden bg-app font-sans">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Header />

        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
