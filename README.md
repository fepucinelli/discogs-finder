# Discogs Finder

Hear a record spinning. Find the exact pressing. Add it to your Discogs collection in seconds.

Discogs Finder is a full-stack web application that listens to music through your microphone, identifies the track using audio recognition, searches the Discogs database for matching releases, and lets you add the exact pressing to your collection — all in one flow.

---

## Features

- **Audio recognition** — records up to 12 seconds of audio via the browser microphone and identifies the track using the AudD API
- **Discogs search** — searches the Discogs database by artist and title, returning up to 20 releases with cover art, year, format, label, and country
- **Collection management** — adds any found release directly to your Discogs collection (uncategorized folder) with one click
- **OAuth 1.0a authentication** — full Discogs OAuth flow; no passwords stored, access tokens encrypted in cookies
- **Warm analog UI** — editorial aesthetic with CSS-drawn vinyl disc, grain overlay, and custom typography
- **Accessible** — skip-to-content link, focus-visible outlines, ARIA live regions, descriptive labels on all interactive elements

---

## Tech Stack

| Layer | Choice | Reason |
|---|---|---|
| Framework | Next.js 16 (App Router) | File-based routing, server components, API routes in one project |
| Language | TypeScript 5 (strict) | End-to-end type safety across routes and components |
| Styling | Tailwind CSS v4 + custom CSS | Utility base; design tokens and component styles in plain CSS |
| Fonts | `next/font/google` | Self-hosted, no render-blocking external requests |
| Images | `next/image` | Automatic optimisation and WebP conversion for Discogs covers |
| Session | `iron-session` | Encrypted, HttpOnly, SameSite cookies — no JWT complexity |
| OAuth | `oauth-1.0a` + Node `crypto` | Lightweight; HMAC-SHA1 signing for Discogs API calls |
| Audio | Web `MediaRecorder` API | Native browser recording, no third-party SDK |
| Recognition | AudD API | Accurate music fingerprinting via server-side proxy |

---

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── discogs/route.ts      # Step 1: OAuth request token + redirect
│   │   │   ├── callback/route.ts     # Step 2: OAuth access token + session write
│   │   │   ├── logout/route.ts       # Session destroy + redirect home
│   │   │   └── me/route.ts           # Current session info (authenticated, username)
│   │   ├── discogs/
│   │   │   ├── search/route.ts       # Discogs database search (GET)
│   │   │   └── collection/route.ts   # Add to collection (POST) / fetch collection (GET)
│   │   └── recognize/route.ts        # Audio recognition proxy to AudD (POST)
│   ├── listen/
│   │   ├── layout.tsx                # Metadata + OpenGraph for /listen
│   │   └── page.tsx                  # Main app page: recorder + results
│   ├── layout.tsx                    # Root layout: fonts, header, skip link, preconnect
│   ├── page.tsx                      # Landing page with CTA
│   ├── error.tsx                     # Error boundary (client component)
│   └── globals.css                   # Design tokens, animations, component styles
├── components/
│   ├── Header.tsx                    # Sticky nav: logo, auth links, username
│   ├── AudioRecorder.tsx             # Mic capture, countdown, status machine
│   └── ReleaseCard.tsx               # Release display + add-to-collection button
└── lib/
    ├── session.ts                    # iron-session config + getSession() helper
    └── oauth.ts                      # OAuth instance, DISCOGS_API constant, USER_AGENT
```

---

## Architecture

### Authentication — OAuth 1.0a

Discogs uses OAuth 1.0a (not 2.0). The flow runs entirely on the server; the browser never sees any token.

```
Browser                   Next.js Server              Discogs
   |                            |                         |
   | GET /api/auth/discogs      |                         |
   |--------------------------->|                         |
   |                            | GET /oauth/request_token|
   |                            |------------------------>|
   |                            |<-- oauth_token + secret |
   |                            | (stored in session)     |
   |<-- redirect to discogs.com/oauth/authorize           |
   |                            |                         |
   |         (user approves on discogs.com)               |
   |                            |                         |
   | GET /api/auth/callback     |                         |
   | ?oauth_token=&oauth_verifier=                        |
   |--------------------------->|                         |
   |                            | POST /oauth/access_token|
   |                            |------------------------>|
   |                            |<-- access_token + secret|
   |                            | GET /oauth/identity     |
   |                            |------------------------>|
   |                            |<-- username             |
   |                            | (saved in session)      |
   |<-- redirect to /listen     |                         |
```

**Signature methods used:**
- Request token step: `PLAINTEXT` — signature is `consumer_secret&` (no token secret yet)
- Access token step: `PLAINTEXT` — signature is `consumer_secret&request_token_secret`
- All subsequent API calls: `HMAC-SHA1` via the `oauth-1.0a` library

### Session

`iron-session` encrypts the session data into a single cookie using AES-256-CBC. Nothing sensitive is stored client-side. Cookie flags:

```
HttpOnly    — no JavaScript access (XSS protection)
SameSite=Lax — blocks cross-site request forgery
Secure      — HTTPS-only in production
MaxAge      — 7 days
```

Session shape:

```typescript
interface SessionData {
  discogs_request_token?:        string;  // temporary, cleared after callback
  discogs_request_token_secret?: string;  // temporary, cleared after callback
  discogs_access_token?:         string;  // persisted for 7 days
  discogs_access_token_secret?:  string;  // persisted for 7 days
  discogs_username?:             string;  // persisted for 7 days
}
```

### Audio Recognition

The browser records audio using `MediaRecorder`, prefers `audio/webm` and falls back to `audio/ogg`. After 12 seconds (or on manual stop) the recorded chunks are assembled into a `Blob` and sent as `multipart/form-data` to `/api/recognize`.

The API route proxies the audio to AudD's endpoint — the AudD token never leaves the server. AudD returns artist, title, album, label, release date, and a streaming link. The result is forwarded to the client and triggers an immediate Discogs search.

```
Browser                  Next.js Server           AudD
   |                           |                    |
   | MediaRecorder (12s)       |                    |
   | POST /api/recognize       |                    |
   | (FormData: audio blob)    |                    |
   |-------------------------->|                    |
   |                           | POST api.audd.io/  |
   |                           | (audio + api_token)|
   |                           |------------------->|
   |                           |<-- {artist, title} |
   |<-- {artist, title, ...}   |                    |
```

The recognize route sets `Cache-Control: no-store` — each audio clip is unique, caching would be wrong.

### Discogs Search & Collection

All Discogs API requests are made server-side. The client posts to local API routes, which sign the requests with the stored OAuth tokens and forward to Discogs.

**Search** (`/api/discogs/search`):
- Calls `GET /database/search?type=release&artist=…&track=…`
- Returns 20 results, maps to a minimal `Release` shape
- Cached for 1 hour (`public, max-age=3600, stale-while-revalidate=86400`) — search results for a given artist/title don't change frequently

**Add to collection** (`POST /api/discogs/collection`):
- Calls `POST /users/{username}/collection/folders/1/releases/{release_id}`
- Folder 1 is the "Uncategorized" default folder in every Discogs account
- Returns the `instance_id` of the new collection entry

**Fetch collection** (`GET /api/discogs/collection`):
- Calls `GET /users/{username}/collection/folders/0/releases` (folder 0 = all folders)
- Sorted by `added` descending, 50 per page
- Cached for 5 minutes (`private, max-age=300`) — private because it's user-specific data

### Rendering Strategy

| Route | Strategy | Reason |
|---|---|---|
| `/` | Server Component | Static marketing page, no client state needed |
| `/listen` | Client Component (`"use client"`) | Needs `MediaRecorder`, `useState`, browser APIs |
| `Header` | Client Component | Fetches `/api/auth/me` to show auth state |
| `AudioRecorder` | Client Component | Browser mic access, state machine |
| `ReleaseCard` | Client Component | Optimistic add-button state |
| All API routes | Server (Route Handlers) | Secrets stay on server; OAuth signing |

### Caching

| Endpoint | Cache-Control | Rationale |
|---|---|---|
| `/api/discogs/search` | `public, max-age=3600, stale-while-revalidate=86400` | Search results are stable; reduce Discogs API load |
| `/api/discogs/collection` (GET) | `private, max-age=300, stale-while-revalidate=600` | User-specific; short TTL to reflect recent adds |
| `/api/recognize` | `no-store` | Unique per audio clip; caching is semantically wrong |
| Auth routes | None set (default no-cache) | State-changing, must always be fresh |

### Performance

- **Fonts** — `next/font/google` self-hosts Google Fonts at build time; no external font requests, automatic `font-display: swap`
- **Images** — `next/image` converts Discogs covers to WebP with explicit `width`/`height` to prevent layout shift
- **No third-party scripts** — no analytics, no tracking, no chat widgets; zero third-party JS weight
- **CSS animations** — all animations use `transform` and `opacity` (GPU-composited); vinyl disc uses `will-change: transform`
- **DNS preconnect** — `preconnect` for `api.discogs.com` and `dns-prefetch` for `api.audd.io` declared in root layout
- **Bundle** — no UI component libraries; only `iron-session` (≈10 KB) and `oauth-1.0a` (small) added at runtime

### Accessibility

- Skip-to-content link (visually hidden, revealed on focus)
- Global `:focus-visible` outline — 2px amber, 3px offset, on all interactive elements
- `role="alert"` on error messages — announced immediately by screen readers
- `role="status"` + `aria-live="polite"` on transient status messages (searching, recorder state)
- `aria-busy` on the record button during processing and on add buttons while in-flight
- Descriptive `aria-label` on every interactive element: record button reflects current state, add buttons include release title and state
- Decorative elements (◆ diamond labels, blink dot, vinyl SVG) marked `aria-hidden="true"`
- Semantic landmarks: `<header>`, `<nav aria-label="Main navigation">`, `<main id="main-content">`, `<section aria-label="…">`

---

## Setup

### Prerequisites

- Node.js 20+
- A [Discogs developer application](https://www.discogs.com/settings/developers) (consumer key + secret)
- An [AudD API token](https://audd.io/)

### Environment variables

Create `.env.local` in the project root:

```env
# Discogs OAuth application credentials
DISCOGS_CONSUMER_KEY=your_consumer_key
DISCOGS_CONSUMER_SECRET=your_consumer_secret

# Must match the callback URL registered in your Discogs app settings
DISCOGS_CALLBACK_URL=http://localhost:3000/api/auth/callback

# AudD audio recognition
AUDD_API_TOKEN=your_audd_token

# Session encryption — generate with: openssl rand -hex 32
SESSION_SECRET=64_char_hex_string
```

### Discogs app settings

In your Discogs developer app, set the callback URL to match `DISCOGS_CALLBACK_URL`. For local development: `http://localhost:3000/api/auth/callback`.

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Deployment

The app is designed for Vercel. Set the five environment variables in the Vercel dashboard and update `DISCOGS_CALLBACK_URL` to your production domain:

```
DISCOGS_CALLBACK_URL=https://your-domain.com/api/auth/callback
```

Update the same URL in your Discogs app settings.

No database is required. All state is either in the encrypted session cookie or fetched live from Discogs.

---

## API Reference

### `GET /api/auth/discogs`
Initiates Discogs OAuth. Redirects the browser to `discogs.com/oauth/authorize`.

### `GET /api/auth/callback`
Handles the OAuth callback. Exchanges the verifier for access tokens, fetches the Discogs username, writes the session, and redirects to `/listen`.

### `GET /api/auth/me`
Returns the current session state.
```json
{ "authenticated": true, "username": "discogs_username" }
```

### `GET /api/auth/logout`
Destroys the session and redirects to `/`.

### `POST /api/recognize`
Identifies a song from an audio file.

**Request:** `multipart/form-data` with an `audio` field (Blob, `audio/webm` or `audio/ogg`).

**Response:**
```json
{
  "result": {
    "artist": "string",
    "title": "string",
    "album": "string | undefined",
    "release_date": "string | undefined",
    "label": "string | undefined",
    "timecode": "string | undefined",
    "song_link": "string | undefined"
  }
}
```
`result` is `null` if the song was not recognized.

### `GET /api/discogs/search`
Searches the Discogs database.

**Query params:** `artist` + `title`, or `q` (free text). Requires auth.

**Response:**
```json
{
  "results": [
    {
      "id": 12345,
      "title": "Artist – Album Title",
      "year": "1971",
      "thumb": "https://…",
      "cover_image": "https://…",
      "format": ["Vinyl", "LP"],
      "label": ["RCA Victor"],
      "country": "US",
      "uri": "/releases/12345",
      "master_id": 54321
    }
  ],
  "pagination": { "page": 1, "pages": 1, "per_page": 20, "items": 5 }
}
```

### `POST /api/discogs/collection`
Adds a release to the authenticated user's collection.

**Body:** `{ "release_id": 12345 }`

**Response:** `{ "success": true, "instance_id": 98765 }`

### `GET /api/discogs/collection`
Returns the authenticated user's full collection (newest first, 50 per page).
