"use client";

import Image from "next/image";
import { useState } from "react";

export interface Release {
  id: number;
  title: string;
  year?: string;
  thumb?: string;
  cover_image?: string;
  format?: string[];
  label?: string[];
  country?: string;
}

interface Props {
  release: Release;
  onAdd: (releaseId: number) => Promise<void>;
}

export default function ReleaseCard({ release, onAdd }: Props) {
  const [status, setStatus] = useState<"idle" | "adding" | "added" | "error">("idle");

  async function handleAdd() {
    setStatus("adding");
    try {
      await onAdd(release.id);
      setStatus("added");
    } catch {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  }

  const imgSrc = release.thumb || release.cover_image;

  const meta = [
    release.year,
    release.country,
    release.format?.join(" · "),
    release.label?.[0],
  ]
    .filter(Boolean)
    .join("  ·  ");

  return (
    <div className="release-card">
      {/* Cover art */}
      <div
        style={{
          flexShrink: 0,
          width: 56,
          height: 56,
          background: "var(--ink-raised)",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={release.title}
            width={56}
            height={56}
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "sepia(0.15) brightness(0.95)" }}
            unoptimized
          />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <circle cx="12" cy="12" r="10" stroke="var(--ink-border2)" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="3"  stroke="var(--ink-border2)" strokeWidth="1.5" />
              <circle cx="12" cy="12" r="0.8" fill="var(--ink-border2)" />
            </svg>
          </div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p
          className="font-body"
          style={{
            fontSize: 14,
            fontWeight: 500,
            color: "var(--cream)",
            lineHeight: 1.35,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            marginBottom: 5,
          }}
        >
          {release.title}
        </p>
        {meta && (
          <p
            className="font-mono"
            style={{
              fontSize: 10,
              color: "var(--cream-3)",
              letterSpacing: "0.06em",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {meta}
          </p>
        )}
      </div>

      {/* Add button */}
      <button
        onClick={status === "idle" ? handleAdd : undefined}
        disabled={status !== "idle"}
        className={`add-btn ${status !== "idle" ? status : ""}`}
      >
        {status === "added"
          ? "✓ Added"
          : status === "adding"
          ? "Adding…"
          : status === "error"
          ? "Failed"
          : "+ Add"}
      </button>
    </div>
  );
}
