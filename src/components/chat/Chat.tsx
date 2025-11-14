"use client";

import { useEffect, useRef, useState, type ClipboardEvent } from "react";
import { v4 as uuidv4 } from "uuid";
import InputBar from "./InputBar";
import MessageList, { ChatMessage } from "./MessageList";
import TypingDots from "./TypingDots";

type AskResponse = {
  answer: string;
  citations: Array<{
    source: string | null;
    page: number | null;
    section: string | null;
  }>;
  cached: boolean;
  error?: string;
};

// Frequently Asked Questions
const FAQ_QUESTIONS = [
  "Which residences require a meal plan?",
  "How to submit a maintenance request?",
  "Is laundry available in residence?",
  "How do I pay my residence fees?",
  "What are the quiet hours?",
  "Are there bike storage rooms?",
  "What is the SafeWalk program?",
  "How do I request an accessibility accommodation for housing?",
  "Can I have a party in my room?",
  "Can I request a room switch?",
];

/**
 * ID generator that works in all environments:
 * - Use Web Crypto's randomUUID if it exists (modern browsers).
 * - Fallback to uuid v4 for SSR/older runtimes.
 */
function makeId(): string {
  const maybeCrypto: any = typeof crypto !== "undefined" ? crypto : undefined;
  if (maybeCrypto && typeof maybeCrypto.randomUUID === "function") {
    return maybeCrypto.randomUUID();
  }
  return uuidv4();
}

export default function Chat({ className = "" }: { className?: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  // 1) Load chat history on mount (using sessionStorage instead of localStorage)
  // This means history clears when browser tab/window closes
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("chat-session");
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) setMessages(parsed);
    } catch {
      // ignore bad sessionStorage values
    }
  }, []);

  // 2) Save chat history whenever it changes (to sessionStorage)
  useEffect(() => {
    try {
      sessionStorage.setItem("chat-session", JSON.stringify(messages));
    } catch {
      // storage might be full or blocked; ignore
    }
  }, [messages]);

  // 3) Auto-scroll on new messages or while "typing"
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  // 4) Send a question to the backend
  async function ask(question: string) {
    const trimmed = question.trim();
    if (trimmed.length === 0) return;

    setErr(null);

    // Append user's message
    setMessages((m) => [
      ...m,
      { id: makeId(), role: "user", content: trimmed },
    ]);
    setLoading(true);

    try {
      // Abort in 20s to avoid hanging requests
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20_000);

      const res = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        // show raw text if server sent a message
        const msg = await res.text().catch(() => "");
        throw new Error(msg || `HTTP ${res.status}`);
      }

      const data = (await res.json()) as AskResponse;
      if (data.error) throw new Error(data.error);

      // Append assistant's answer
      setMessages((m) => [
        ...m,
        {
          id: makeId(),
          role: "assistant",
          content: data.answer,
          meta: { cached: data.cached, citations: data.citations },
        },
      ]);
    } catch (e: any) {
      const message =
        typeof e?.message === "string" ? e.message : "Something went wrong.";
      setErr(message);

      // Append friendly error bubble
      setMessages((m) => [
        ...m,
        {
          id: makeId(),
          role: "assistant",
          content: "Sorry — I hit a snag. Please try again.",
          meta: { error: true },
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  // 5) Copy handler: copy only the selected text (no extra UI chrome)
  function handleCopy(e: ClipboardEvent) {
    const sel = window.getSelection()?.toString().trim();
    if (!sel) return;
    e.preventDefault();
    e.clipboardData.setData("text/plain", sel);
  }

  return (
    <div
      className={[
        // roomy container; parent page can override via className
        "mx-auto w-full max-w-4xl rounded-3xl border border-white/10 bg-white/5 shadow-xl backdrop-blur",
        "flex flex-col overflow-hidden",
        className,
      ].join(" ")}
    >
      <div className="flex-1 overflow-y-auto p-4 sm:p-6" onCopy={handleCopy}>
        {messages.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center h-full space-y-5">
            <div className="text-center space-y-2">
              <div className="text-5xl">💬</div>
              <h2 className="text-xl font-semibold text-slate-200">
                How can I help you today?
              </h2>
              <p className="text-xs text-slate-400 max-w-md">
                Choose a question below or type your own
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-3xl px-4">
              {FAQ_QUESTIONS.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => ask(question)}
                  className="group relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] px-3 py-2.5 text-left text-xs text-slate-200 transition-all hover:border-indigo-400/50 hover:bg-white/10 hover:shadow-md hover:shadow-indigo-500/20 hover:scale-[1.02]"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base shrink-0">💡</span>
                    <span className="flex-1 font-medium leading-snug">
                      {question}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/0 via-purple-500/5 to-pink-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        )}
        
        <MessageList messages={messages} />
        {loading && <TypingDots className="mt-2" />}
        <div ref={scrollRef} />
      </div>

      {err && (
        <div className="mx-4 mb-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
          {err}
        </div>
      )}

      <div className="border-t border-white/10 p-3 sm:p-4">
        <InputBar onSend={ask} disabled={loading} />
        <p className="mt-2 text-xs text-slate-400">
          Tip: <kbd className="rounded bg-white/10 px-1">Enter</kbd> to send,{" "}
          <kbd className="rounded bg-white/10 px-1">Shift</kbd>+
          <kbd className="rounded bg-white/10 px-1">Enter</kbd> for a new line.
        </p>
      </div>
    </div>
  );
}
