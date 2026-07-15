interface TagProps {
  label: string;
  variant?: "default" | "category";
  color?: string;
}

export default function Tag({ label, variant = "default", color }: TagProps) {
  if (variant === "category" && color) {
    return (
      <span
        className="inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium"
        style={{ backgroundColor: `${color}15`, color }}
      >
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center rounded-md border border-edge bg-elevated px-2 py-0.5 text-[11px] text-zinc-500">
      {label}
    </span>
  );
}
