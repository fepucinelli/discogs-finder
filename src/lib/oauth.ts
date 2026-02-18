import OAuth from "oauth-1.0a";
import crypto from "crypto";

export const discogs = new OAuth({
  consumer: {
    key: process.env.DISCOGS_CONSUMER_KEY!,
    secret: process.env.DISCOGS_CONSUMER_SECRET!,
  },
  signature_method: "HMAC-SHA1",
  hash_function(base_string: string, key: string) {
    return crypto.createHmac("sha1", key).update(base_string).digest("base64");
  },
});

export const DISCOGS_API = "https://api.discogs.com";
export const USER_AGENT = "DiscogsVinylFinder/1.0";

export function buildAuthHeader(
  method: string,
  url: string,
  token?: { key: string; secret: string }
): string {
  const authData = discogs.authorize(
    { url, method },
    token
  );
  return discogs.toHeader(authData).Authorization;
}
