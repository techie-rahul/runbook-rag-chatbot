export default function TypingIndicator() {
  return (
    <div className="flex max-w-[80%] items-start gap-3">
      <div className="rounded-xl rounded-tl-sm border border-edge bg-surface px-4 py-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-medium text-zinc-500">Analyzing</span>
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
  );
}
