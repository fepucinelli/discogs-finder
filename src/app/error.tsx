"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main
      style={{
        maxWidth: 660,
        margin: "0 auto",
        padding: "3.5rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "1.5rem",
      }}
    >
      <p
        className="font-mono"
        style={{
          fontSize: 12,
          letterSpacing: "0.06em",
          color: "var(--crimson)",
          background: "rgba(196,64,64,0.08)",
          border: "1px solid rgba(196,64,64,0.25)",
          padding: "12px 16px",
        }}
      >
        Something went wrong.{error.digest ? ` (${error.digest})` : ""}
      </p>
      <button
        onClick={reset}
        className="font-mono"
        style={{
          background: "none",
          border: "1px solid var(--ink-border)",
          fontSize: 11,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "var(--cream-2)",
          cursor: "pointer",
          padding: "8px 20px",
        }}
      >
        Try again
      </button>
    </main>
  );
}
