"use server";

import { getSession } from "@/lib/session";
import { buildAuthHeader, DISCOGS_API, USER_AGENT } from "@/lib/oauth";
import { Release } from "@/components/ReleaseCard";

interface DiscogsSearchResult {
  id: number;
  title: string;
  year?: string;
  thumb?: string;
  cover_image?: string;
  format?: string[];
  label?: string[];
  country?: string;
}

export interface SearchState {
  releases: Release[];
  error: string | null;
}

export interface AddState {
  status: "idle" | "added" | "error";
  message?: string;
}

export async function searchDiscogs(
  _prev: SearchState,
  formData: FormData
): Promise<SearchState> {
  const session = await getSession();
  if (!session.discogs_access_token || !session.discogs_access_token_secret) {
    return { releases: [], error: "Not authenticated" };
  }

  const artist = formData.get("artist") as string;
  const title = formData.get("title") as string;

  const params = new URLSearchParams({ type: "release", per_page: "20" });
  if (artist) params.set("artist", artist);
  if (title) params.set("track", title);

  const url = `${DISCOGS_API}/database/search?${params.toString()}`;
  const authHeader = buildAuthHeader("GET", url, {
    key: session.discogs_access_token,
    secret: session.discogs_access_token_secret,
  });

  const res = await fetch(url, {
    headers: { Authorization: authHeader, "User-Agent": USER_AGENT },
  });

  if (!res.ok) return { releases: [], error: "Discogs search failed" };

  const data = await res.json();
  return {
    releases:
      data.results?.map((r: DiscogsSearchResult) => ({
        id: r.id,
        title: r.title,
        year: r.year,
        thumb: r.thumb,
        cover_image: r.cover_image,
        format: r.format,
        label: r.label,
        country: r.country,
      })) ?? [],
    error: null,
  };
}

export async function addToCollection(
  _prev: AddState,
  formData: FormData
): Promise<AddState> {
  const session = await getSession();
  if (!session.discogs_access_token || !session.discogs_access_token_secret || !session.discogs_username) {
    return { status: "error", message: "Not authenticated" };
  }

  const releaseId = formData.get("release_id");
  const url = `${DISCOGS_API}/users/${session.discogs_username}/collection/folders/1/releases/${releaseId}`;
  const authHeader = buildAuthHeader("POST", url, {
    key: session.discogs_access_token,
    secret: session.discogs_access_token_secret,
  });

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "User-Agent": USER_AGENT,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) return { status: "error", message: "Failed to add to collection" };
  return { status: "added" };
}
