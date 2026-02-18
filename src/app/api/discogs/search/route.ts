import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { discogs, DISCOGS_API, USER_AGENT } from "@/lib/oauth";

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session.discogs_access_token || !session.discogs_access_token_secret) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const artist = searchParams.get("artist") ?? "";
  const title = searchParams.get("title") ?? "";
  const query = searchParams.get("q") ?? "";

  const params = new URLSearchParams({ type: "release", per_page: "20" });
  if (query) {
    params.set("q", query);
  } else {
    if (artist) params.set("artist", artist);
    if (title) params.set("track", title);
  }

  const url = `${DISCOGS_API}/database/search?${params.toString()}`;

  const authHeader = discogs.toHeader(
    discogs.authorize(
      { url, method: "GET" },
      { key: session.discogs_access_token, secret: session.discogs_access_token_secret }
    )
  ).Authorization;

  const res = await fetch(url, {
    headers: {
      Authorization: authHeader,
      "User-Agent": USER_AGENT,
    },
  });

  if (!res.ok) {
    return NextResponse.json({ error: "Discogs search failed" }, { status: 502 });
  }

  const data = await res.json();

  return NextResponse.json({
    results: data.results?.map((r: DiscogsSearchResult) => ({
      id: r.id,
      title: r.title,
      year: r.year,
      thumb: r.thumb,
      cover_image: r.cover_image,
      format: r.format,
      label: r.label,
      country: r.country,
      uri: r.uri,
      master_id: r.master_id,
    })) ?? [],
    pagination: data.pagination,
  }, { headers: { "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400" } });
}

interface DiscogsSearchResult {
  id: number;
  title: string;
  year?: string;
  thumb?: string;
  cover_image?: string;
  format?: string[];
  label?: string[];
  country?: string;
  uri?: string;
  master_id?: number;
}
