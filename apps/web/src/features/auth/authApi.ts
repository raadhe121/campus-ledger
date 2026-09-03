import type { ApiSuccess, PublicUser } from "@campus-ledger/shared-types";
import type { LoginInput } from "@campus-ledger/validation-schemas";
import { apiSlice } from "../../app/apiSlice";

interface SessionPayload {
  user: PublicUser;
  accessToken: string;
}

export const authApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<ApiSuccess<SessionPayload>, LoginInput>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    // No body — the httpOnly cookie is what authenticates this call.
    // Used both to recover from a mid-session 401 (apiSlice.ts) and to
    // silently restore a session on page load (AuthBootstrap).
    refresh: builder.mutation<ApiSuccess<SessionPayload>, void>({
      query: () => ({ url: "/auth/refresh", method: "POST" }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({ url: "/auth/logout", method: "POST" }),
    }),
  }),
});

export const { useLoginMutation, useRefreshMutation, useLogoutMutation } = authApi;
