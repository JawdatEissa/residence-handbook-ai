import MessageBubble from './MessageBubble';

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  meta?: {
    cached?: boolean;
    citations?: Array<{ source: string | null; page: number | null; section: string | null }>;
    error?: boolean;
  };
};

export default function MessageList({ messages }: { messages: ChatMessage[] }) {
  if (messages.length === 0) {
    return (
      <div className="mx-auto max-w-prose rounded-2xl bg-white/5 p-6 text-sm text-slate-300">
        Ask about housing policies, fees, move-ins, maintenance requests, guest rules, etc.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
    </div>
  );
}