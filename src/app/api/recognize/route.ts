import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session.discogs_access_token) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const formData = await req.formData();
  const audioFile = formData.get("audio") as File | null;

  if (!audioFile) {
    return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
  }

  const auddForm = new FormData();
  auddForm.append("api_token", process.env.AUDD_API_TOKEN!);
  auddForm.append("file", audioFile);
  auddForm.append("return", "apple_music,spotify");

  const res = await fetch("https://api.audd.io/", {
    method: "POST",
    body: auddForm,
  });

  if (!res.ok) {
    return NextResponse.json({ error: "AudD request failed" }, { status: 502 });
  }

  const data = await res.json();

  if (data.status === "error") {
    return NextResponse.json({ error: data.error?.error_message ?? "Recognition failed" }, { status: 422 });
  }

  if (!data.result) {
    return NextResponse.json({ result: null });
  }

  return NextResponse.json({
    result: {
      artist: data.result.artist,
      title: data.result.title,
      album: data.result.album,
      release_date: data.result.release_date,
      label: data.result.label,
      timecode: data.result.timecode,
      song_link: data.result.song_link,
    },
  });
}
