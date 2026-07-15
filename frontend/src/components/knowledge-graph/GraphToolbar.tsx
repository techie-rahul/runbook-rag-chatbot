import { useReactFlow } from "@xyflow/react";
import { ZoomIn, ZoomOut, Maximize, RotateCcw } from "lucide-react";

export default function GraphToolbar() {
  const { zoomIn, zoomOut, fitView, setViewport } = useReactFlow();

  const buttons = [
    { icon: ZoomIn, label: "Zoom In", action: () => zoomIn({ duration: 200 }) },
    { icon: ZoomOut, label: "Zoom Out", action: () => zoomOut({ duration: 200 }) },
    { icon: Maximize, label: "Fit View", action: () => fitView({ duration: 300, padding: 0.2 }) },
    { icon: RotateCcw, label: "Reset", action: () => setViewport({ x: 0, y: 0, zoom: 1 }, { duration: 300 }) },
  ] as const;

  return (
    <div className="absolute top-4 right-4 z-10 flex gap-1 rounded-xl border border-edge bg-sidebar p-1">
      {buttons.map(({ icon: Icon, label, action }) => (
        <button
          key={label}
          onClick={action}
          title={label}
          className="rounded-lg p-2 text-zinc-500 transition-colors hover:bg-elevated hover:text-zinc-300"
        >
          <Icon className="h-4 w-4" />
        </button>
      ))}
    </div>
  );
}
