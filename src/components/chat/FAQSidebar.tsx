"use client";

import { useState } from "react";

interface FAQSidebarProps {
  onAskQuestion: (question: string) => void;
}

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
  "Where to eat on campus?",
];

export default function FAQSidebar({ onAskQuestion }: FAQSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile: Collapsible FAQs at top */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 transition-all"
        >
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className="text-lg">💡</span>
            Common Questions
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isOpen && (
          <div className="mt-2 p-3 rounded-2xl border border-white/10 bg-white/5 space-y-1.5 max-h-[60vh] overflow-y-auto">
            {FAQ_QUESTIONS.map((question, idx) => (
              <button
                key={idx}
                onClick={() => {
                  onAskQuestion(question);
                  setIsOpen(false);
                }}
                  className="w-full group relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] px-3 py-2 text-left text-xs text-slate-200 transition-all hover:border-emerald-400/50 hover:bg-white/10 hover:shadow-md hover:shadow-emerald-500/20"
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm shrink-0">💡</span>
                  <span className="flex-1 font-medium leading-snug">
                    {question}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: Persistent sidebar */}
      <div className="hidden lg:block">
        <div className="sticky top-6">
          <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur p-4">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">💡</span>
              <h3 className="text-sm font-semibold text-slate-200">
                Common Questions
              </h3>
            </div>
            
            <div className="space-y-1.5 max-h-[calc(100vh-180px)] overflow-y-auto pr-1 custom-scrollbar">
              {FAQ_QUESTIONS.map((question, idx) => (
                <button
                  key={idx}
                  onClick={() => onAskQuestion(question)}
                  className="w-full group relative overflow-hidden rounded-lg border border-white/10 bg-gradient-to-br from-white/5 to-white/[0.02] px-3 py-2 text-left text-xs text-slate-200 transition-all hover:border-emerald-400/50 hover:bg-white/10 hover:shadow-md hover:shadow-emerald-500/20 hover:scale-[1.01]"
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm shrink-0 mt-0.5">💡</span>
                    <span className="flex-1 font-medium leading-snug">
                      {question}
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-teal-500/5 to-cyan-500/0 opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(52, 211, 153, 0.3);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(52, 211, 153, 0.5);
        }
      `}</style>
    </>
  );
}

