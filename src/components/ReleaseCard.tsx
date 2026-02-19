"use client";

import Image from "next/image";
import { useActionState, useOptimistic } from "react";
import { useFormStatus } from "react-dom";
import { AddState } from "@/app/actions";

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
  addAction: (prev: AddState, formData: FormData) => Promise<AddState>;
}

interface AddButtonProps {
  releaseTitle: string;
  optimisticAdded: boolean;
  actionStatus: AddState["status"];
}

function AddButton({ releaseTitle, optimisticAdded, actionStatus }: AddButtonProps) {
  const { pending } = useFormStatus();
  const isAdded = optimisticAdded || actionStatus === "added";

  const label =
    isAdded          ? "✓ Added"  :
    pending          ? "Adding…"  :
    actionStatus === "error" ? "Failed"  : "+ Add";

  const ariaLabel =
    isAdded          ? `${releaseTitle} added to your collection` :
    pending          ? `Adding ${releaseTitle} to your collection…` :
    actionStatus === "error" ? `Failed to add ${releaseTitle}. Try again.` :
                       `Add ${releaseTitle} to your collection`;

  return (
    <button
      type="submit"
      disabled={pending || isAdded}
      aria-label={ariaLabel}
      aria-busy={pending}
      className={`add-btn ${pending ? "adding" : actionStatus !== "idle" ? actionStatus : ""}`}
    >
      {label}
    </button>
  );
}

export default function ReleaseCard({ release, addAction }: Props) {
  const [state, formAction] = useActionState(addAction, { status: "idle" });
  const [optimisticAdded, setOptimisticAdded] = useOptimistic(
    state.status === "added",
    (_: boolean, val: boolean) => val
  );

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
            alt={`Cover art for ${release.title}`}
            width={56}
            height={56}
            sizes="56px"
            style={{ width: "100%", height: "100%", objectFit: "cover", filter: "sepia(0.15) brightness(0.95)" }}
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
            <svg aria-hidden="true" viewBox="0 0 24 24" width="22" height="22" fill="none">
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

      {/* Add form */}
      <form
        action={async (fd) => {
          setOptimisticAdded(true);
          await formAction(fd);
        }}
      >
        <input type="hidden" name="release_id" value={release.id} />
        <AddButton
          releaseTitle={release.title}
          optimisticAdded={optimisticAdded}
          actionStatus={state.status}
        />
      </form>
    </div>
  );
}
