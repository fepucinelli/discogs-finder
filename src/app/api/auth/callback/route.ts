import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { discogs, DISCOGS_API, USER_AGENT } from "@/lib/oauth";
import crypto from "crypto";

/**
 * Discogs OAuth 1.0a — Access Token step.
 *
 * PLAINTEXT signature = percentEncode(consumer_secret)&percentEncode(token_secret)
 * At this step we DO have the request token secret.
 */
function buildAccessTokenHeader(
  consumerKey: string,
  consumerSecret: string,
  requestToken: string,
  requestTokenSecret: string,
  verifier: string
): string {
  const nonce = crypto.randomBytes(16).toString("base64").replace(/[^a-zA-Z0-9]/g, "");
  const timestamp = Math.floor(Date.now() / 1000).toString();
  // PLAINTEXT signature: consumer_secret&token_secret
  const signature = `${encodeURIComponent(consumerSecret)}&${encodeURIComponent(requestTokenSecret)}`;

  return (
    "OAuth " +
    [
      `oauth_consumer_key="${encodeURIComponent(consumerKey)}"`,
      `oauth_nonce="${nonce}"`,
      `oauth_signature="${encodeURIComponent(signature)}"`,
      `oauth_signature_method="PLAINTEXT"`,
      `oauth_timestamp="${timestamp}"`,
      `oauth_token="${encodeURIComponent(requestToken)}"`,
      `oauth_verifier="${encodeURIComponent(verifier)}"`,
      `oauth_version="1.0"`,
    ].join(", ")
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const oauthToken = searchParams.get("oauth_token");
  const oauthVerifier = searchParams.get("oauth_verifier");

  if (!oauthToken || !oauthVerifier) {
    return NextResponse.redirect(new URL("/?error=oauth_cancelled", req.url));
  }

  const session = await getSession();

  if (!session.discogs_request_token || !session.discogs_request_token_secret) {
    return NextResponse.redirect(new URL("/?error=session_missing", req.url));
  }

  const accessTokenURL = `${DISCOGS_API}/oauth/access_token`;

  const authHeader = buildAccessTokenHeader(
    process.env.DISCOGS_CONSUMER_KEY!,
    process.env.DISCOGS_CONSUMER_SECRET!,
    session.discogs_request_token,
    session.discogs_request_token_secret,
    oauthVerifier
  );

  const res = await fetch(accessTokenURL, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });

  if (!res.ok) {
    const detail = await res.text();
    return NextResponse.redirect(
      new URL(`/?error=access_token_failed&detail=${encodeURIComponent(detail)}`, req.url)
    );
  }

  const body = await res.text();
  const params = new URLSearchParams(body);
  const accessToken = params.get("oauth_token");
  const accessTokenSecret = params.get("oauth_token_secret");

  if (!accessToken || !accessTokenSecret) {
    return NextResponse.redirect(new URL("/?error=access_token_missing", req.url));
  }

  // Fetch Discogs identity to get username (use HMAC-SHA1 for regular API calls)
  const identityURL = `${DISCOGS_API}/oauth/identity`;
  const identityAuth = discogs.toHeader(
    discogs.authorize(
      { url: identityURL, method: "GET" },
      { key: accessToken, secret: accessTokenSecret }
    )
  ).Authorization;

  const identityRes = await fetch(identityURL, {
    headers: {
      Authorization: identityAuth,
      "User-Agent": USER_AGENT,
    },
  });

  const identity = await identityRes.json();

  session.discogs_access_token = accessToken;
  session.discogs_access_token_secret = accessTokenSecret;
  session.discogs_username = identity.username;
  delete session.discogs_request_token;
  delete session.discogs_request_token_secret;
  await session.save();

  return NextResponse.redirect(new URL("/listen", req.url));
}
