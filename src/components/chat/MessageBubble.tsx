import type { ChatMessage } from "./MessageList";
import ReactMarkdown from "react-markdown";

export default function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}>
      <div
        className={[
          // wider on big screens; still not edge-to-edge
          "max-w-[92%] md:max-w-[78%] xl:max-w-[72%] rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-lg",
          isUser
            ? "bg-teal-800 text-white shadow-teal-950/40 border border-teal-700/30"
            : message.meta?.error
            ? "bg-rose-900/40 text-rose-100 border border-rose-400/20"
            : "bg-gradient-to-br from-white/10 to-white/5 text-slate-100 border border-white/10 shadow-black/20",
        ].join(" ")}
      >
        {isUser ? (
          <div className="whitespace-pre-wrap">{message.content}</div>
        ) : (
          <div className="prose prose-sm prose-invert max-w-none [&>*]:my-2 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4">
            <ReactMarkdown
              components={{
                a: ({ ...props }) => (
                  <a
                    {...props}
                    className="text-cyan-300 hover:text-cyan-200 underline font-medium"
                    target="_blank"
                    rel="noopener noreferrer"
                  />
                ),
                p: ({ ...props }) => (
                  <p {...props} className="whitespace-pre-wrap" />
                ),
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}

        {!isUser && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px] text-slate-400">
            {message.meta?.cached && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2.5 py-1 text-emerald-300 border border-emerald-400/20">
                <svg
                  className="w-3 h-3"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                cached
              </span>
            )}
            {Array.isArray(message.meta?.citations) &&
              message.meta!.citations!.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <svg
                    className="w-3 h-3 text-slate-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  {message.meta!.citations!.map((c, idx) => {
                    const sourceName =
                      c.source || "Residence_and_Housing_Handbook2025.pdf";
                    const pageInfo =
                      c.section || (c.page ? `Page ${c.page}` : "");
                    return (
                      <span
                        key={idx}
                        className="inline-flex items-center rounded-full bg-white/5 px-2 py-0.5 border border-white/10"
                      >
                        {sourceName}
                        {pageInfo && ` (${pageInfo})`}
                      </span>
                    );
                  })}
                </div>
              )}
          </div>
        )}
      </div>
    </div>
  );
}
