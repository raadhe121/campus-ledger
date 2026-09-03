import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranscribeAudioMutation } from "./transcriptionApi";

type RecorderState = "idle" | "recording" | "ready";

export function AudioToTextPage() {
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [clip, setClip] = useState<Blob | null>(null);
  const [clipUrl, setClipUrl] = useState<string | null>(null);
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const [transcribe, { isLoading, error: transcribeError }] = useTranscribeAudioMutation();
  const [transcript, setTranscript] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (clipUrl) URL.revokeObjectURL(clipUrl);
    };
  }, [clipUrl]);

  function setNewClip(blob: Blob) {
    if (clipUrl) URL.revokeObjectURL(clipUrl);
    setClip(blob);
    setClipUrl(URL.createObjectURL(blob));
    setTranscript(null);
  }

  async function startRecording() {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        setNewClip(new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" }));
        stream.getTracks().forEach((track) => track.stop());
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecorderState("recording");
    } catch {
      setMicError("Couldn't access the microphone — check your browser's permission for this page.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecorderState("ready");
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setNewClip(file);
      setRecorderState("ready");
    }
  }

  async function onTranscribe() {
    if (!clip) return;
    const form = new FormData();
    form.append("audio", clip, clip instanceof File ? clip.name : "recording.webm");
    try {
      const { data } = await transcribe(form).unwrap();
      setTranscript(data.text);
    } catch {
      // surfaced below
    }
  }

  const errorMessage =
    transcribeError && typeof transcribeError === "object" && "data" in transcribeError
      ? ((transcribeError.data as { error?: { message?: string } })?.error?.message ?? "Transcription failed")
      : transcribeError
        ? "Could not reach the server"
        : null;

  return (
    <div className="min-h-screen bg-paper">
      <header className="sticky top-0 z-10 backdrop-blur-xl bg-paper/70 border-b border-line">
        <div className="mx-auto max-w-3xl px-6 h-14 flex items-center justify-between">
          <Link to="/designs" className="flex items-center gap-2 text-sm font-semibold text-ink hover:text-accent-strong">
            ← Designs
          </Link>
          <span className="rounded-full bg-ink text-white px-3 py-1 text-xs font-bold tracking-widest">DEV TOOL</span>
        </div>
      </header>

      <div className="mx-auto max-w-xl px-6 py-10">
        <div className="rounded-2xl border border-line bg-surface p-7 card-shadow relative overflow-hidden mb-6">
          <div className="absolute -top-16 -right-16 h-40 w-40 rounded-full bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 blur-2xl" />
          <p className="relative text-[11px] font-mono uppercase tracking-[0.18em] font-bold text-gold">Dev tool · Groq Whisper</p>
          <h1 className="relative text-2xl font-semibold tracking-tight text-ink mt-1">Audio → text</h1>
          <p className="relative text-sm leading-6 text-muted mt-2">Record from your mic or upload a file — sent server-side to Groq, key never touches the browser.</p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 card-shadow grid gap-5">
          <div className="flex flex-wrap items-center gap-3">
            {recorderState !== "recording" ? (
              <button
                type="button"
                onClick={startRecording}
                className="inline-flex items-center gap-2 rounded-full bg-accent text-accent-ink text-sm font-semibold px-5 py-2.5 hover:bg-accent-strong transition-colors shadow-sm"
              >
                <span className="h-2 w-2 rounded-full bg-red-400 animate-pulse" />
                Start recording
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="inline-flex items-center gap-2 rounded-full bg-rose-600 text-white text-sm font-semibold px-5 py-2.5 hover:bg-rose-700 animate-pulse shadow-sm"
              >
                ■ Stop
              </button>
            )}
            <span className="text-sm text-muted">or</span>
            <label className="rounded-full border border-line bg-surface px-4 py-2 text-sm font-semibold text-ink hover:bg-surface-2 cursor-pointer transition-colors">
              Upload file
              <input type="file" accept="audio/*" onChange={onFileSelected} className="hidden" />
            </label>
          </div>

          {micError && <p className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">{micError}</p>}

          {clipUrl && (
            <div className="rounded-2xl bg-surface-2/40 border border-line p-4 grid gap-3">
              <p className="text-[11px] font-mono uppercase tracking-widest font-bold text-muted">Clip ready · {clip?.size ? `${(clip.size / 1024).toFixed(1)} KB` : ""}</p>
              <audio controls src={clipUrl} className="w-full rounded-xl" />
              <button
                type="button"
                onClick={onTranscribe}
                disabled={isLoading}
                className="justify-self-start rounded-full bg-ink text-white text-sm font-semibold px-5 py-2.5 hover:bg-black disabled:opacity-60 transition-colors"
              >
                {isLoading ? "Transcribing…" : "✨ Transcribe"}
              </button>
            </div>
          )}

          {errorMessage && (
            <p role="alert" className="text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl px-3 py-2.5">
              {errorMessage}
            </p>
          )}

          {transcript && (
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50/50 border border-emerald-200 p-5">
              <p className="text-[11px] font-mono uppercase tracking-widest font-bold text-emerald-700">Transcript</p>
              <p className="text-sm leading-6 text-ink whitespace-pre-wrap mt-2">{transcript}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
