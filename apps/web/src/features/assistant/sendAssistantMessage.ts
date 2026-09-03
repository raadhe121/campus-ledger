import type { ApiSuccess, PublicUser } from "@campus-ledger/shared-types";
import type { AppDispatch, RootState } from "../../app/store";
import { credentialsReceived, loggedOut } from "../auth/authSlice";
import { assistantActions } from "./assistantSlice";

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:4000/api/v1";

type WireEvent = { type: "text"; text: string } | { type: "status"; text: string } | { type: "error"; message: string } | { type: "done" };

/**
 * A plain thunk, not RTK Query — the widget needs deltas as they arrive,
 * and RTK Query's fetch wrapper isn't built for that (the same reasoning
 * apiSlice.ts gives for file uploads). Replays apiSlice's own 401→refresh
 * →retry dance by hand for the same reason: this request never goes
 * through the shared baseQuery.
 */
export function sendAssistantMessage(content: string) {
  return async (dispatch: AppDispatch, getState: () => RootState) => {
    const trimmed = content.trim();
    if (!trimmed) return;

    const priorTurns = getState()
      .assistant.messages.filter((m) => !m.error && m.content.length > 0)
      .map((m) => ({ role: m.role, content: m.content }));
    const history = [...priorTurns, { role: "user" as const, content: trimmed }].slice(-24);

    const turnId = crypto.randomUUID();
    dispatch(assistantActions.userMessageSent({ turnId, content: trimmed }));
    const replyId = `${turnId}:a`;

    await streamReply(dispatch, getState, history, replyId, false);
  };
}

async function streamReply(dispatch: AppDispatch, getState: () => RootState, history: { role: "user" | "assistant"; content: string }[], replyId: string, isRetry: boolean) {
  const token = getState().auth.accessToken;
  if (!token) {
    dispatch(assistantActions.assistantError({ id: replyId, message: "You're signed out — sign in again to use the assistant." }));
    return;
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE}/assistant/chat`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ messages: history }),
    });
  } catch {
    dispatch(assistantActions.assistantError({ id: replyId, message: "Could not reach the server." }));
    return;
  }

  // Same 15-minute access-token expiry apiSlice.ts's baseQueryWithReauth
  // handles for every other route — spend the refresh cookie once, retry
  // once, give up cleanly on a second failure.
  if (res.status === 401 && !isRetry) {
    const refreshed = await tryRefresh(dispatch);
    if (refreshed) {
      await streamReply(dispatch, getState, history, replyId, true);
      return;
    }
    dispatch(assistantActions.assistantError({ id: replyId, message: "Your session expired — sign in again." }));
    return;
  }

  if (!res.ok || !res.body) {
    dispatch(assistantActions.assistantError({ id: replyId, message: "Something went wrong." }));
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex = buffer.indexOf("\n");
      while (newlineIndex >= 0) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (line) applyEvent(dispatch, replyId, JSON.parse(line) as WireEvent);
        newlineIndex = buffer.indexOf("\n");
      }
    }
  } catch {
    dispatch(assistantActions.assistantError({ id: replyId, message: "Connection interrupted." }));
    return;
  }

  dispatch(assistantActions.streamFinished());
}

function applyEvent(dispatch: AppDispatch, replyId: string, event: WireEvent) {
  if (event.type === "text") dispatch(assistantActions.assistantTextDelta({ id: replyId, text: event.text }));
  else if (event.type === "status") dispatch(assistantActions.assistantStatus({ id: replyId, text: event.text }));
  else if (event.type === "error") dispatch(assistantActions.assistantError({ id: replyId, message: event.message }));
}

async function tryRefresh(dispatch: AppDispatch): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, { method: "POST", credentials: "include" });
    if (!res.ok) {
      dispatch(loggedOut());
      return false;
    }
    const body = (await res.json()) as ApiSuccess<{ user: PublicUser; accessToken: string }>;
    dispatch(credentialsReceived(body.data));
    return true;
  } catch {
    return false;
  }
}
