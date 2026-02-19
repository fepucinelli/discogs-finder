import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import ListenClient from "@/components/ListenClient";

export default async function ListenPage() {
  const session = await getSession();
  if (!session.discogs_access_token) redirect("/");
  return <ListenClient username={session.discogs_username!} />;
}
