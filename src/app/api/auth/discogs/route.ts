import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { DISCOGS_API, USER_AGENT } from "@/lib/oauth";
import crypto from "crypto";

/**
 * Discogs OAuth 1.0a — Request Token step.
 *
 * Discogs uses PLAINTEXT signature method for the request/access token steps:
 * https://www.discogs.com/developers/#page:authentication,oauth-flow
 *
 * PLAINTEXT signature = percentEncode(consumer_secret)&percentEncode(token_secret)
 * (token_secret is empty here, so it's just consumer_secret&)
 */
function buildRequestTokenHeader(
  consumerKey: string,
  consumerSecret: string,
  callbackURL: string
): string {
  const nonce = crypto.randomBytes(16).toString("base64").replace(/[^a-zA-Z0-9]/g, "");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  // PLAINTEXT signature: consumer_secret& (no token secret yet)
  const signature = `${encodeURIComponent(consumerSecret)}&`;

  return (
    "OAuth " +
    [
      `oauth_consumer_key="${encodeURIComponent(consumerKey)}"`,
      `oauth_nonce="${nonce}"`,
      `oauth_signature="${encodeURIComponent(signature)}"`,
      `oauth_signature_method="PLAINTEXT"`,
      `oauth_timestamp="${timestamp}"`,
      `oauth_callback="${encodeURIComponent(callbackURL)}"`,
      `oauth_version="1.0"`,
    ].join(", ")
  );
}

export async function GET() {
  const requestTokenURL = `${DISCOGS_API}/oauth/request_token`;
  const callbackURL = process.env.DISCOGS_CALLBACK_URL!;
  const consumerKey = process.env.DISCOGS_CONSUMER_KEY!;
  const consumerSecret = process.env.DISCOGS_CONSUMER_SECRET!;

  const authHeader = buildRequestTokenHeader(consumerKey, consumerSecret, callbackURL);

  const res = await fetch(requestTokenURL, {
    method: "GET",
    headers: {
      Authorization: authHeader,
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json(
      { error: "Failed to get request token", detail: text },
      { status: 500 }
    );
  }

  const body = await res.text();
  const params = new URLSearchParams(body);
  const oauthToken = params.get("oauth_token");
  const oauthTokenSecret = params.get("oauth_token_secret");

  if (!oauthToken || !oauthTokenSecret) {
    return NextResponse.json({ error: "Missing token in Discogs response" }, { status: 500 });
  }

  const session = await getSession();
  session.discogs_request_token = oauthToken;
  session.discogs_request_token_secret = oauthTokenSecret;
  await session.save();

  return NextResponse.redirect(`https://www.discogs.com/oauth/authorize?oauth_token=${oauthToken}`);
}
