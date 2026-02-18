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
    <header
      style={{
        position: "sticky",
        top: 0,
        zIndex: 100,
        height: 60,
        borderBottom: "1px solid var(--ink-border)",
        background: "rgba(16,12,9,0.94)",
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
      }}
    >
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "0 2.5rem",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: "none", lineHeight: 1 }}>
          <span
            className="font-display"
            style={{ fontSize: 21, color: "var(--cream)", letterSpacing: "-0.02em" }}
          >
            Discogs
            <span style={{ color: "var(--amber)" }}>Finder</span>
          </span>
        </Link>

        {/* Nav */}
        <nav style={{ display: "flex", alignItems: "center", gap: 28 }}>
          {session?.authenticated ? (
            <>
              <Link
                href="/listen"
                className="font-mono header-nav-link"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                Listen
              </Link>
              <span
                className="font-mono"
                style={{
                  fontSize: 11,
                  color: "var(--cream-3)",
                  letterSpacing: "0.06em",
                }}
              >
                @{session.username}
              </span>
              <a
                href="/api/auth/logout"
                className="font-mono header-logout-link"
                style={{
                  fontSize: 11,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                }}
              >
                Exit
              </a>
            </>
          ) : session === null ? null : (
            <a
              href="/api/auth/discogs"
              className="font-mono header-connect-btn"
              style={{
                fontSize: 11,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "#100c09",
                padding: "7px 18px",
                textDecoration: "none",
                fontWeight: 500,
              }}
            >
              Connect
            </a>
          )}
        </nav>
      </div>
    </header>
  );
}
