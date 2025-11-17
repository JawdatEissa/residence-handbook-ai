"use client";

import { useEffect, useRef, useState } from "react";

export default function InputBar({
  onSend,
  disabled,
}: {
  onSend: (text: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  // Auto-grow up to a cap for comfort
  function autoResize() {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    const next = Math.min(el.scrollHeight, 160); // cap ~ 8-9 lines
    el.style.height = `${next}px`;
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    autoResize();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function submit() {
    const q = value.trim();
    if (!q || disabled) return;
    onSend(q);
    setValue("");
    // reset height
    const el = ref.current;
    if (el) el.style.height = "";
  }

  return (
    <div className="flex items-end gap-3">
      <textarea
        ref={ref}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Type your question…"
        rows={1}
        className="min-h-[48px] max-h-40 flex-1 resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/30 transition-all shadow-inner"
        aria-label="Message input"
      />
      <button
        type="button"
        onClick={submit}
        disabled={disabled || !value.trim()}
        className="h-[48px] shrink-0 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 px-6 text-sm font-semibold text-white transition-all hover:from-emerald-400 hover:to-teal-400 hover:shadow-lg hover:shadow-emerald-500/30 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:shadow-none"
        aria-label="Send"
      >
        <span className="flex items-center gap-2">
          Send
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 9l3 3m0 0l-3 3m3-3H8m13 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </span>
      </button>
    </div>
  );
}
