import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface AssistantMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  /** A transient "Checking your attendance…" line shown while a tool call is in flight — cleared the moment real text starts arriving. */
  status?: string;
  error?: string;
}

interface AssistantState {
  isOpen: boolean;
  messages: AssistantMessage[];
  /** The id of the assistant message currently being streamed into, or null between turns — what the widget uses to disable the input. */
  streamingReplyId: string | null;
}

const initialState: AssistantState = { isOpen: false, messages: [], streamingReplyId: null };

// Client-only chat state — deliberately not RTK Query (its fetch wrapper
// doesn't stream) and not persisted server-side (§12-style scope
// trimming: a conversation living for the tab's lifetime is enough for a
// v1 assistant; add a real thread store if cross-session history matters
// later). One slice, one conversation per browser tab, same as the
// widget's own scope — see AssistantWidget.tsx.
const assistantSlice = createSlice({
  name: "assistant",
  initialState,
  reducers: {
    toggled(state) {
      state.isOpen = !state.isOpen;
    },
    cleared(state) {
      state.messages = [];
      state.streamingReplyId = null;
    },
    userMessageSent(state, action: PayloadAction<{ turnId: string; content: string }>) {
      const replyId = `${action.payload.turnId}:a`;
      state.messages.push({ id: `${action.payload.turnId}:u`, role: "user", content: action.payload.content });
      state.messages.push({ id: replyId, role: "assistant", content: "", status: "Thinking…" });
      state.streamingReplyId = replyId;
    },
    assistantTextDelta(state, action: PayloadAction<{ id: string; text: string }>) {
      const message = state.messages.find((m) => m.id === action.payload.id);
      if (message) {
        message.content += action.payload.text;
        message.status = undefined;
      }
    },
    assistantStatus(state, action: PayloadAction<{ id: string; text: string }>) {
      const message = state.messages.find((m) => m.id === action.payload.id);
      if (message) message.status = action.payload.text;
    },
    assistantError(state, action: PayloadAction<{ id: string; message: string }>) {
      const message = state.messages.find((m) => m.id === action.payload.id);
      if (message) {
        message.error = action.payload.message;
        message.status = undefined;
      }
      state.streamingReplyId = null;
    },
    streamFinished(state) {
      state.streamingReplyId = null;
    },
  },
});

export const assistantActions = assistantSlice.actions;
export default assistantSlice.reducer;
