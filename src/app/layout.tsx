import type { Metadata, Viewport } from "next";
import { Abril_Fatface, Lora, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";

const abril = Abril_Fatface({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-abril",
});

const lora = Lora({
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  subsets: ["latin"],
  variable: "--font-lora",
});

const ibmMono = IBM_Plex_Mono({
  weight: ["300", "400", "500"],
  subsets: ["latin"],
  variable: "--font-ibm-mono",
});

export const metadata: Metadata = {
  title: {
    default: "Discogs Finder — Hear it. Find it. Collect it.",
    template: "%s | Discogs Finder",
  },
  description: "Listen to a record and add it to your Discogs collection instantly.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://api.discogs.com" />
        <link rel="dns-prefetch" href="https://api.discogs.com" />
        <link rel="dns-prefetch" href="https://api.audd.io" />
      </head>
      <body className={`${abril.variable} ${lora.variable} ${ibmMono.variable}`}>
        <Header />
        {children}
      </body>
    </html>
  );
}
