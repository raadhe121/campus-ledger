import { useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { AppDispatch, RootState } from "../../app/store";
import { Icon } from "../../components/Icon";
import { assistantActions, type AssistantMessage } from "./assistantSlice";
import { sendAssistantMessage } from "./sendAssistantMessage";

/**
 * Mounted once, in RequireAuth (see routes/guards.tsx) — not inside any
 * one role's AppShell — so it's present on every authenticated screen for
 * every role, including STAFF, which has no dashboard/layout of its own
 * yet. What it can actually see and do is entirely a server-side decision
 * (assistant.tools.ts, keyed off the caller's role); this component has
 * no role-specific branching beyond the placeholder copy below.
 */
export function AssistantWidget() {
  const dispatch = useDispatch<AppDispatch>();
  const { isOpen, messages, streamingReplyId } = useSelector((state: RootState) => state.assistant);
  const user = useSelector((state: RootState) => state.auth.user);
  const [draft, setDraft] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen]);

  if (!user) return null;

  const onSend = () => {
    const content = draft.trim();
    if (!content || streamingReplyId) return;
    setDraft("");
    dispatch(sendAssistantMessage(content));
  };

  return (
    <>
      <button
        type="button"
        onClick={() => dispatch(assistantActions.toggled())}
        aria-label={isOpen ? "Close assistant" : "Open assistant"}
        className="fixed bottom-5 right-5 z-40 h-14 w-14 rounded-full bg-accent text-accent-ink shadow-lg flex items-center justify-center hover:bg-accent-strong transition-colors"
      >
        <Icon name={isOpen ? "close" : "smart_toy"} size={26} />
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-5 z-40 w-[min(380px,calc(100vw-2.5rem))] h-[min(560px,calc(100vh-8rem))] bg-surface border border-line rounded-2xl card-shadow flex flex-col overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line bg-surface-2/60 shrink-0">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Assistant</p>
              <p className="text-xs text-muted truncate">Your own data, or how to use Campus Ledger.</p>
            </div>
            {messages.length > 0 && (
              <button type="button" onClick={() => dispatch(assistantActions.cleared())} className="text-xs font-medium text-muted hover:text-ink shrink-0">
                Clear
              </button>
            )}
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
            {messages.length === 0 ? (
              <p className="text-sm text-muted text-center mt-8">Ask me anything about your account, or how to do something in Campus Ledger.</p>
            ) : (
              messages.map((m) => <MessageBubble key={m.id} message={m} />)
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              onSend();
            }}
            className="border-t border-line p-3 flex items-end gap-2 shrink-0"
          >
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  onSend();
                }
              }}
              rows={1}
              placeholder="Ask a question…"
              disabled={Boolean(streamingReplyId)}
              className="flex-1 resize-none rounded-lg border border-line bg-paper px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!draft.trim() || Boolean(streamingReplyId)}
              aria-label="Send"
              className="h-9 w-9 shrink-0 rounded-lg bg-accent text-accent-ink flex items-center justify-center hover:bg-accent-strong disabled:opacity-40 transition-colors"
            >
              <Icon name="send" size={18} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}

function MessageBubble({ message }: { message: AssistantMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm whitespace-pre-wrap break-words ${isUser ? "bg-accent text-accent-ink" : "bg-surface-2 text-ink"}`}>
        {message.error ? <span className="text-rose-600">{message.error}</span> : message.content ? message.content : <span className="text-muted italic">{message.status ?? "…"}</span>}
      </div>
    </div>
  );
}
