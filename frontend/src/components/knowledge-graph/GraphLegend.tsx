export default function GraphLegend() {
  const items = [
    { color: "bg-success", label: "Healthy" },
    { color: "bg-warning", label: "Warning" },
    { color: "bg-danger", label: "Critical" },
  ];

  return (
    <div className="absolute bottom-4 left-4 z-10 rounded-xl border border-edge bg-sidebar px-4 py-3">
      <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Legend</p>
      <div className="space-y-1.5">
        {items.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <span className={`h-2 w-2 rounded-full ${color}`} />
            <span className="text-[11px] text-zinc-500">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <span className="h-0 w-4 border-t border-dashed border-zinc-600" />
          <span className="text-[11px] text-zinc-500">External</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="h-0 w-4 border-t-2 border-danger" />
          <span className="text-[11px] text-zinc-500">Root Cause Path</span>
        </div>
      </div>
    </div>
  );
}
