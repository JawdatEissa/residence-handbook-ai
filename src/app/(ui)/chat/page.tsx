// src/app/(ui)/chat/page.tsx
export const dynamic = "force-dynamic";

import Chat from "@/components/chat/Chat";

export default function Page() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-black text-slate-100">
      {/* Outer page padding stays roomy on ultra-wide screens */}
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header width matches chat card and is centered */}
        <div className="mx-auto max-w-4xl text-center">
          <h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Residence Assistant
          </h1>
          <p className="mt-3 text-base text-slate-300">
            Ask questions about policies, fees, move in/out day, and more. Answers are
            grounded in the official Residence & Housing materials.
          </p>
        </div>

        {/* Chat card uses the same max-w so edges align perfectly */}
        <Chat className="mx-auto mt-6 h-[82vh] max-h-[calc(100vh-12rem)] max-w-4xl" />
      </div>
    </main>
  );
}
