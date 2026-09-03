import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { PublicUser } from "@campus-ledger/shared-types";

// Client-only session state — the access token and the identity it
// belongs to. Everything server-derived instead lives in RTK Query
// caches, never here (architecture §09).
interface AuthState {
  user: PublicUser | null;
  accessToken: string | null;
  // Has the app finished trying to restore a session from the refresh
  // cookie yet? Route guards wait on this instead of flashing the login
  // page for the split second before that first /auth/refresh resolves.
  bootstrapped: boolean;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  bootstrapped: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    credentialsReceived(state, action: PayloadAction<{ user: PublicUser; accessToken: string }>) {
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
      state.bootstrapped = true;
    },
    loggedOut(state) {
      state.user = null;
      state.accessToken = null;
      state.bootstrapped = true;
    },
  },
});

export const { credentialsReceived, loggedOut } = authSlice.actions;
export default authSlice.reducer;
