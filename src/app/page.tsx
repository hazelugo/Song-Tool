import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 p-4">
      <h1 className="text-4xl font-bold">Song Tool</h1>
      <p className="text-muted-foreground">Manage your songs and playlists</p>
      <div className="flex gap-4">
        <Link href="/songs" className={buttonVariants()}>
          Song Discovery
        </Link>
        <Link
          href="/playlists"
          className={buttonVariants({ variant: "secondary" })}
        >
          My Playlists
        </Link>
      </div>
    </div>
  );
}
