import type { ApiSuccess } from "@campus-ledger/shared-types";
import { apiSlice } from "../../app/apiSlice";

export const transcriptionApi = apiSlice.injectEndpoints({
  endpoints: (builder) => ({
    // FormData body — fetchBaseQuery passes it straight through and lets
    // the browser set the multipart boundary; no JSON header override needed.
    transcribeAudio: builder.mutation<ApiSuccess<{ text: string }>, FormData>({
      query: (body) => ({ url: "/dev/transcribe", method: "POST", body }),
    }),
  }),
});

export const { useTranscribeAudioMutation } = transcriptionApi;
