import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Listen",
};

export default function ListenLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
