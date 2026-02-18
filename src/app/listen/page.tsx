"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AudioRecorder, { RecognitionResult } from "@/components/AudioRecorder";
import ReleaseCard, { Release } from "@/components/ReleaseCard";

export default function ListenPage() {
  const router = useRouter();
  const [track, setTrack] = useState<RecognitionResult | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (!data.authenticated) router.replace("/");
        else setUsername(data.username);
      });
  }, [router]);

  async function handleResult(result: RecognitionResult) {
    setTrack(result);
    setError(null);
    setReleases([]);
    setSearching(true);

    try {
      const params = new URLSearchParams({ artist: result.artist, title: result.title });
      const res = await fetch(`/api/discogs/search?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Search failed");
      setReleases(data.results ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function handleAdd(releaseId: number) {
    const res = await fetch("/api/discogs/collection", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ release_id: releaseId }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error ?? "Failed to add");
    }
  }

  function handleReset() {
    setTrack(null);
    setReleases([]);
    setError(null);
  }

  return (
    <main
      style={{
        maxWidth: 660,
        margin: "0 auto",
        padding: "3.5rem 1.5rem 6rem",
      }}
    >
      {/* Username — subtle */}
      {username && (
        <p
          className="font-mono fade-up"
          style={{
            textAlign: "center",
            fontSize: 10,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: "var(--cream-3)",
            marginBottom: "3rem",
          }}
        >
          @{username}
        </p>
      )}

      {/* ── Recorder ──────────────────────────────────────────── */}
      <section
        className="fade-up"
        style={{
          display: "flex",
          justifyContent: "center",
          marginBottom: "3.5rem",
          animationDelay: "80ms",
        }}
      >
        <AudioRecorder onResult={handleResult} onError={setError} />
      </section>

      {/* ── Error ─────────────────────────────────────────────── */}
      {error && (
        <div
          className="font-mono fade-up"
          style={{
            fontSize: 12,
            letterSpacing: "0.06em",
            color: "var(--crimson)",
            background: "rgba(196,64,64,0.08)",
            border: "1px solid rgba(196,64,64,0.25)",
            padding: "12px 16px",
            marginBottom: "2rem",
          }}
        >
          {error}
        </div>
      )}

      {/* ── Recognized track ──────────────────────────────────── */}
      {track && (
        <section className="fade-up" style={{ marginBottom: "2.5rem" }}>
          {/* Section label */}
          <div
            className="font-mono"
            style={{
              fontSize: 9,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--amber)",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            ◆ Recognized
            <span
              style={{
                flex: 1,
                height: 1,
                background: "var(--ink-border)",
                display: "block",
              }}
            />
          </div>

          {/* Track card */}
          <div
            style={{
              background: "var(--ink-surface)",
              border: "1px solid var(--ink-border)",
              padding: "20px 22px",
            }}
          >
            <p
              className="font-display"
              style={{
                fontSize: 28,
                lineHeight: 1.1,
                color: "var(--cream)",
                marginBottom: 6,
                letterSpacing: "-0.01em",
              }}
            >
              {track.title}
            </p>
            <p
              className="font-body"
              style={{
                fontSize: 15,
                fontStyle: "italic",
                color: "var(--cream-2)",
                marginBottom: track.album ? 4 : 0,
              }}
            >
              {track.artist}
            </p>
            {track.album && (
              <p
                className="font-mono"
                style={{ fontSize: 11, color: "var(--cream-3)", letterSpacing: "0.06em" }}
              >
                {track.album}
              </p>
            )}

            <div
              style={{
                marginTop: 16,
                paddingTop: 14,
                borderTop: "1px solid var(--ink-border)",
                display: "flex",
                gap: 20,
              }}
            >
              {track.song_link && (
                <a
                  href={track.song_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono"
                  style={{
                    fontSize: 10,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    color: "var(--amber)",
                    textDecoration: "none",
                  }}
                >
                  Stream →
                </a>
              )}
              <button
                onClick={handleReset}
                className="font-mono"
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 10,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  color: "var(--cream-3)",
                  cursor: "pointer",
                  padding: 0,
                  textDecoration: "underline",
                  textUnderlineOffset: 3,
                }}
              >
                Clear
              </button>
            </div>
          </div>
        </section>
      )}

      {/* ── Searching ─────────────────────────────────────────── */}
      {searching && (
        <div
          className="font-mono shimmer"
          style={{
            textAlign: "center",
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--cream-3)",
            padding: "2rem 0",
          }}
        >
          Searching Discogs…
        </div>
      )}

      {/* ── Results ───────────────────────────────────────────── */}
      {!searching && releases.length > 0 && (
        <section className="fade-up">
          <div
            className="font-mono"
            style={{
              fontSize: 9,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--amber)",
              marginBottom: "1rem",
              display: "flex",
              alignItems: "center",
              gap: 12,
            }}
          >
            ◆ {releases.length} releases found
            <span
              style={{
                flex: 1,
                height: 1,
                background: "var(--ink-border)",
                display: "block",
              }}
            />
          </div>

          <p
            className="font-body"
            style={{
              fontSize: 13,
              fontStyle: "italic",
              color: "var(--cream-3)",
              marginBottom: "1.25rem",
            }}
          >
            Pick the exact pressing to add to your collection.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {releases.map((release, i) => (
              <div
                key={release.id}
                className="fade-up"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <ReleaseCard release={release} onAdd={handleAdd} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── No results ────────────────────────────────────────── */}
      {!searching && track && releases.length === 0 && !error && (
        <p
          className="font-body"
          style={{
            textAlign: "center",
            fontStyle: "italic",
            fontSize: 15,
            color: "var(--cream-3)",
            padding: "2rem 0",
          }}
        >
          No Discogs releases found for&nbsp;
          <em style={{ color: "var(--cream-2)" }}>{track.title}</em>
          &nbsp;by&nbsp;
          <em style={{ color: "var(--cream-2)" }}>{track.artist}</em>.
        </p>
      )}
    </main>
  );
}
