type Props = { className?: string };

/**
 * Minimal "typing" indicator (three pulsing dots).
 * Inspired by your reference's animated dots. */
export default function TypingDots({ className }: Props) {
  return (
    <div
      className={`flex items-center gap-1.5 self-start rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 px-4 py-3 shadow-lg ${
        className || ""
      }`}
    >
      <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-indigo-400" />
      <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-purple-400 [animation-delay:120ms]" />
      <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-pink-400 [animation-delay:240ms]" />
    </div>
  );
}
