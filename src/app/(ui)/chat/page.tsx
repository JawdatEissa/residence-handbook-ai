// src/app/(ui)/chat/page.tsx
"use client";

export const dynamic = "force-dynamic";

import Chat from "@/components/chat/Chat";
import FAQSidebar from "@/components/chat/FAQSidebar";
import { useRef } from "react";

export default function Page() {
  // Create a ref to call the ask function from Chat
  const chatRef = useRef<{ ask: (question: string) => void } | null>(null);

  const handleFAQClick = (question: string) => {
    chatRef.current?.ask(question);
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-10">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Residence Assistant
          </h1>
          <p className="mt-2 text-sm sm:text-base text-slate-300 max-w-2xl mx-auto">
            Ask questions about policies, fees, move in/out day, and more. Answers are
            grounded in the official Residence & Housing materials.
          </p>
        </div>

        {/* Main Content: FAQ Sidebar + Chat */}
        <div className="flex flex-col lg:flex-row gap-4 lg:gap-6">
          {/* FAQ Sidebar - Hidden on mobile, shown on desktop */}
          <aside className="lg:w-80 flex-shrink-0">
            <FAQSidebar onAskQuestion={handleFAQClick} />
          </aside>

          {/* Chat Area */}
          <div className="flex-1 min-w-0">
            <Chat 
              ref={chatRef}
              className="h-[70vh] sm:h-[75vh] lg:h-[80vh] max-h-[800px]" 
            />
          </div>
        </div>
      </div>
    </main>
  );
}
