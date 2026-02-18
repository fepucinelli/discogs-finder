"use client";

import { useRef, useState } from "react";

type RecorderStatus = "idle" | "recording" | "processing" | "done" | "error";

interface RecognitionResult {
  artist: string;
  title: string;
  album?: string;
  release_date?: string;
  label?: string;
  song_link?: string;
}

interface Props {
  onResult: (result: RecognitionResult) => void;
  onError: (msg: string) => void;
}

const RECORD_DURATION_MS = 12000; // 12 seconds

export default function AudioRecorder({ onResult, onError }: Props) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [countdown, setCountdown] = useState(RECORD_DURATION_MS / 1000);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg",
      });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await sendAudio();
      };

      setStatus("recording");
      setCountdown(RECORD_DURATION_MS / 1000);
      mediaRecorder.start(250);

      let remaining = RECORD_DURATION_MS / 1000;
      timerRef.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) stopRecording();
      }, 1000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Microphone access denied";
      onError(msg);
      setStatus("error");
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      setStatus("processing");
    }
  }

  async function sendAudio() {
    const blob = new Blob(chunksRef.current, {
      type: chunksRef.current[0]?.type ?? "audio/webm",
    });

    const form = new FormData();
    form.append("audio", blob, "recording.webm");

    try {
      const res = await fetch("/api/recognize", { method: "POST", body: form });
      const data = await res.json();

      if (!res.ok || data.error) {
        throw new Error(data.error ?? "Recognition failed");
      }

      if (!data.result) {
        onError("Song not recognized. Try playing it louder or closer to the mic.");
        setStatus("idle");
        return;
      }

      onResult(data.result);
      setStatus("done");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      onError(msg);
      setStatus("idle");
    }
  }

  function reset() {
    setStatus("idle");
    setCountdown(RECORD_DURATION_MS / 1000);
  }

  const circumference = 2 * Math.PI * 40;
  const progress = status === "recording"
    ? ((RECORD_DURATION_MS / 1000 - countdown) / (RECORD_DURATION_MS / 1000)) * circumference
    : 0;

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Circular progress + button */}
      <div className="relative w-36 h-36">
        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="40" fill="none" stroke="#27272a" strokeWidth="6" />
          {status === "recording" && (
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="#eab308"
              strokeWidth="6"
              strokeDasharray={circumference}
              strokeDashoffset={circumference - progress}
              strokeLinecap="round"
              className="transition-all duration-1000"
            />
          )}
        </svg>

        <button
          onClick={status === "idle" || status === "done" ? startRecording : stopRecording}
          disabled={status === "processing"}
          className={`absolute inset-3 rounded-full flex items-center justify-center text-4xl transition-all ${
            status === "recording"
              ? "bg-red-600 hover:bg-red-500 animate-pulse"
              : status === "processing"
              ? "bg-zinc-700 cursor-wait"
              : "bg-zinc-800 hover:bg-zinc-700"
          }`}
          aria-label={status === "recording" ? "Stop recording" : "Start recording"}
        >
          {status === "processing" ? (
            <span className="text-2xl animate-spin inline-block">⟳</span>
          ) : status === "recording" ? (
            "⏹"
          ) : (
            "🎙"
          )}
        </button>
      </div>

      {/* Status text */}
      <div className="text-center">
        {status === "idle" && (
          <p className="text-zinc-400 text-sm">Tap the mic and play a record</p>
        )}
        {status === "recording" && (
          <p className="text-yellow-400 text-sm font-medium">
            Listening… {countdown}s remaining
          </p>
        )}
        {status === "processing" && (
          <p className="text-zinc-400 text-sm">Identifying song…</p>
        )}
        {status === "done" && (
          <button onClick={reset} className="text-zinc-500 text-sm hover:text-white transition-colors underline">
            Listen again
          </button>
        )}
        {status === "error" && (
          <button onClick={reset} className="text-red-400 text-sm hover:text-white transition-colors underline">
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
