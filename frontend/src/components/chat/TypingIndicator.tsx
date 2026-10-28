export default function TypingIndicator() {
  return (
    <div className="flex max-w-[85%]">
      <div className="space-y-1">
        <div className="flex items-center gap-2 pb-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-accent-muted border border-accent/20">
            <span className="text-[10px] font-bold text-accent">OP</span>
          </div>
          <span className="text-[11px] font-semibold text-zinc-400">OpsPilot</span>
          <span className="text-[10px] text-zinc-600">Retrieving...</span>
        </div>
        <div className="rounded-xl rounded-tl-sm border border-edge bg-surface px-4 py-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-zinc-400">Analyzing runbook evidence & graph dependencies</span>
            <div className="flex items-center gap-1">
              {[0, 1, 2].map((i) => (
                <span
                  key={i}
                  className="inline-block h-1.5 w-1.5 rounded-full bg-accent"
                  style={{
                    animation: "typing-dot 1.4s ease-in-out infinite",
                    animationDelay: `${i * 200}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
