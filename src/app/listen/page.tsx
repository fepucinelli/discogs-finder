"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AudioRecorder from "@/components/AudioRecorder";
import ReleaseCard, { Release } from "@/components/ReleaseCard";

interface RecognitionResult {
  artist: string;
  title: string;
  album?: string;
  release_date?: string;
  label?: string;
  song_link?: string;
}

export default function ListenPage() {
  const router = useRouter();
  const [track, setTrack] = useState<RecognitionResult | null>(null);
  const [releases, setReleases] = useState<Release[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // Auth guard
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
      const params = new URLSearchParams({
        artist: result.artist,
        title: result.title,
      });
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
    <main className="mx-auto max-w-2xl px-4 py-10">
      {username && (
        <p className="text-center text-xs text-zinc-600 mb-8">
          Logged in as <span className="text-zinc-400">@{username}</span>
        </p>
      )}

      {/* Recorder */}
      <section className="flex flex-col items-center mb-10">
        <AudioRecorder onResult={handleResult} onError={setError} />
      </section>

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/40 border border-red-800 text-red-300 rounded-xl px-4 py-3 text-sm mb-6">
          {error}
        </div>
      )}

      {/* Recognized track */}
      {track && (
        <section className="mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">Recognized</p>
            <p className="text-white text-xl font-bold">{track.title}</p>
            <p className="text-zinc-400">{track.artist}</p>
            {track.album && (
              <p className="text-zinc-600 text-sm mt-1">{track.album}</p>
            )}
            <div className="flex gap-3 mt-4">
              {track.song_link && (
                <a
                  href={track.song_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-zinc-500 hover:text-white underline transition-colors"
                >
                  Listen online →
                </a>
              )}
              <button
                onClick={handleReset}
                className="text-xs text-zinc-600 hover:text-zinc-300 underline transition-colors"
              >
                Clear
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Discogs results */}
      {searching && (
        <div className="text-center text-zinc-500 text-sm py-8">
          Searching Discogs…
        </div>
      )}

      {!searching && releases.length > 0 && (
        <section>
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-4">
            {releases.length} releases found — pick one to add
          </p>
          <div className="flex flex-col gap-3">
            {releases.map((release) => (
              <ReleaseCard key={release.id} release={release} onAdd={handleAdd} />
            ))}
          </div>
        </section>
      )}

      {!searching && track && releases.length === 0 && !error && (
        <div className="text-center text-zinc-600 text-sm py-6">
          No Discogs releases found for "{track.title}" by {track.artist}.
        </div>
      )}
    </main>
  );
}
