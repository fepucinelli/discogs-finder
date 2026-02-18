import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { discogs, DISCOGS_API, USER_AGENT } from "@/lib/oauth";

// POST /api/discogs/collection — add a release to the user's collection
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.discogs_access_token || !session.discogs_access_token_secret || !session.discogs_username) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { release_id } = await req.json();
  if (!release_id) {
    return NextResponse.json({ error: "release_id is required" }, { status: 400 });
  }

  const url = `${DISCOGS_API}/users/${session.discogs_username}/collection/folders/1/releases/${release_id}`;

  const authHeader = discogs.toHeader(
    discogs.authorize(
      { url, method: "POST" },
      { key: session.discogs_access_token, secret: session.discogs_access_token_secret }
    )
  ).Authorization;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "User-Agent": USER_AGENT,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ error: "Failed to add to collection", detail: text }, { status: res.status });
  }

  const data = await res.json();
  return NextResponse.json({ success: true, instance_id: data.instance_id });
}

// GET /api/discogs/collection — fetch the user's collection
export async function GET() {
  const session = await getSession();
  if (!session.discogs_access_token || !session.discogs_access_token_secret || !session.discogs_username) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const url = `${DISCOGS_API}/users/${session.discogs_username}/collection/folders/0/releases?per_page=50&sort=added&sort_order=desc`;

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
    return NextResponse.json({ error: "Failed to fetch collection" }, { status: 502 });
  }

  const data = await res.json();
  return NextResponse.json(data, { headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=600" } });
}
