import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Listen",
  description: "Hold your phone up to any record playing — we'll identify the track and find it on Discogs so you can add it to your collection instantly.",
  openGraph: {
    title: "Listen | Discogs Finder",
    description: "Identify any record playing and add it to your Discogs collection instantly.",
    type: "website",
  },
};

export default function ListenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
