"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

interface SessionInfo {
  authenticated: boolean;
  username?: string;
}

export default function Header() {
  const [session, setSession] = useState<SessionInfo | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then(setSession)
      .catch(() => setSession({ authenticated: false }));
  }, []);

  return (
    <header className="border-b border-zinc-800 bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-white font-bold text-lg tracking-tight">
          <span className="text-2xl">🎵</span>
          <span>VinylFinder</span>
        </Link>

        <nav className="flex items-center gap-4">
          {session?.authenticated ? (
            <>
              <Link
                href="/listen"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Listen
              </Link>
              <span className="text-sm text-zinc-500">
                @{session.username}
              </span>
              <a
                href="/api/auth/logout"
                className="text-sm text-zinc-400 hover:text-red-400 transition-colors"
              >
                Logout
              </a>
            </>
          ) : (
            <a
              href="/api/auth/discogs"
              className="text-sm bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              Connect Discogs
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
