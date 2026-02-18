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

  return (
    <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-600 transition-colors">
      <div className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-zinc-800">
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={release.title}
            width={64}
            height={64}
            className="w-full h-full object-cover"
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            💿
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-white font-medium text-sm leading-tight truncate">
          {release.title}
        </p>
        <div className="mt-1 flex flex-wrap gap-2 text-xs text-zinc-500">
          {release.year && <span>{release.year}</span>}
          {release.country && <span>{release.country}</span>}
          {release.format && release.format.length > 0 && (
            <span>{release.format.join(", ")}</span>
          )}
          {release.label && release.label.length > 0 && (
            <span>{release.label[0]}</span>
          )}
        </div>
      </div>

      <button
        onClick={handleAdd}
        disabled={status !== "idle"}
        className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
          status === "added"
            ? "bg-green-900 text-green-300 cursor-default"
            : status === "error"
            ? "bg-red-900 text-red-300 cursor-default"
            : status === "adding"
            ? "bg-zinc-700 text-zinc-400 cursor-wait"
            : "bg-yellow-500 hover:bg-yellow-400 text-black cursor-pointer"
        }`}
      >
        {status === "added" ? "✓ Added" : status === "adding" ? "Adding…" : status === "error" ? "Failed" : "+ Add"}
      </button>
    </div>
  );
}
