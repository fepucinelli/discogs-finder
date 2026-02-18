"use client";

import { useRef, useState } from "react";

type RecorderStatus = "idle" | "recording" | "processing" | "done" | "error";

export interface RecognitionResult {
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

const RECORD_DURATION_MS = 12000;

/* SVG icons — inline, no dependencies */
function IconMic() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="2" width="6" height="11" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
      <line x1="8"  y1="22" x2="16" y2="22" />
    </svg>
  );
}

function IconStop() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <rect x="5" y="5" width="14" height="14" rx="2" />
    </svg>
  );
}

function IconSpinner() {
  return (
    <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" />
      <path d="M12 2a10 10 0 0 1 10 10" className="spin-fast" style={{ transformOrigin: "12px 12px" }} />
    </svg>
  );
}

export default function AudioRecorder({ onResult, onError }: Props) {
  const [status, setStatus] = useState<RecorderStatus>("idle");
  const [countdown, setCountdown] = useState(RECORD_DURATION_MS / 1000);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported("audio/webm")
        ? "audio/webm"
        : "audio/ogg";
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        await sendAudio();
      };

      setStatus("recording");
      setCountdown(RECORD_DURATION_MS / 1000);
      recorder.start(250);

      let remaining = RECORD_DURATION_MS / 1000;
      timerRef.current = setInterval(() => {
        remaining -= 1;
        setCountdown(remaining);
        if (remaining <= 0) stopRecording();
      }, 1000);
    } catch (err) {
      onError(err instanceof Error ? err.message : "Microphone access denied");
      setStatus("error");
    }
  }

  function stopRecording() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
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

      if (!res.ok || data.error) throw new Error(data.error ?? "Recognition failed");

      if (!data.result) {
        onError("Song not recognized — try playing it louder or closer to the mic.");
        setStatus("idle");
        return;
      }

      onResult(data.result);
      setStatus("done");
    } catch (err) {
      onError(err instanceof Error ? err.message : "Unknown error");
      setStatus("idle");
    }
  }

  function reset() {
    setStatus("idle");
    setCountdown(RECORD_DURATION_MS / 1000);
  }

  function handleClick() {
    if (status === "idle" || status === "done" || status === "error") {
      startRecording();
    } else if (status === "recording") {
      stopRecording();
    }
  }

  const isRecording   = status === "recording";
  const isProcessing  = status === "processing";
  const isActive      = isRecording || isProcessing;

  const labelBg = isRecording
    ? "radial-gradient(circle at 38% 35%, #d44040, #8a2020)"
    : "radial-gradient(circle at 38% 35%, var(--amber-2), var(--amber-dark))";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 32,
        userSelect: "none",
      }}
    >
      {/* ── Record + button container ───────────────────────── */}
      <div style={{ position: "relative", width: 248, height: 248 }}>

        {/* Pulse rings — recording only */}
        {isRecording && [0, 0.75, 1.5].map((delay, i) => (
          <div
            key={i}
            className="pulse-ring"
            style={{
              position: "absolute",
              inset: -10,
              borderRadius: "50%",
              border: "1.5px solid var(--amber)",
              pointerEvents: "none",
              animationDelay: `${delay}s`,
            }}
          />
        ))}

        {/* Spinning vinyl disc (visual only) */}
        <div
          className={`vinyl-disc ${isRecording ? "spin-record" : isProcessing ? "spin-fast" : ""}`}
          style={{
            position: "absolute",
            inset: 0,
            cursor: isProcessing ? "wait" : "pointer",
            animationDuration: isProcessing ? "0.7s" : "5s",
          }}
          onClick={isProcessing ? undefined : handleClick}
          role="presentation"
        />

        {/* Center label — stationary sibling, always upright */}
        <button
          onClick={isProcessing ? undefined : handleClick}
          disabled={isProcessing}
          aria-label={isRecording ? "Stop listening" : "Start listening"}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 94,
            height: 94,
            borderRadius: "50%",
            border: "none",
            background: labelBg,
            cursor: isProcessing ? "wait" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            color: "rgba(255,255,255,0.92)",
            boxShadow: "0 0 0 4px #0d0905, 0 4px 24px rgba(0,0,0,0.7)",
            transition: "background 0.3s ease, transform 0.12s ease",
          }}
          onMouseEnter={(e) => {
            if (!isProcessing) e.currentTarget.style.transform = "translate(-50%,-50%) scale(1.05)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translate(-50%,-50%) scale(1)";
          }}
        >
          {isProcessing ? <IconSpinner /> : isRecording ? <IconStop /> : <IconMic />}
        </button>
      </div>

      {/* ── Status line ─────────────────────────────────────── */}
      <div
        className="font-mono"
        style={{
          textAlign: "center",
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          minHeight: 28,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
        }}
      >
        {status === "idle" && (
          <span style={{ color: "var(--cream-3)" }}>Tap the record to listen</span>
        )}

        {status === "recording" && (
          <span style={{ color: "var(--amber)", display: "flex", alignItems: "center", gap: 8 }}>
            <span className="blink" style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: "var(--amber)" }} />
            Listening — {countdown}s
          </span>
        )}

        {status === "processing" && (
          <span className="shimmer" style={{ color: "var(--cream-2)" }}>
            Identifying…
          </span>
        )}

        {status === "done" && (
          <button
            onClick={reset}
            className="font-mono"
            style={{
              background: "none",
              border: "none",
              color: "var(--cream-3)",
              cursor: "pointer",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              padding: 0,
            }}
          >
            Listen again
          </button>
        )}

        {status === "error" && (
          <button
            onClick={reset}
            className="font-mono"
            style={{
              background: "none",
              border: "none",
              color: "var(--crimson)",
              cursor: "pointer",
              fontSize: 11,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              textDecoration: "underline",
              textUnderlineOffset: 3,
              padding: 0,
            }}
          >
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
