import { getIronSession, IronSession } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  discogs_request_token?: string;
  discogs_request_token_secret?: string;
  discogs_access_token?: string;
  discogs_access_token_secret?: string;
  discogs_username?: string;
}

const sessionOptions = {
  password: process.env.SESSION_SECRET!,
  cookieName: "discogs_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const session = await getIronSession<SessionData>(
    await cookies(),
    sessionOptions
  );
  return session;
}
