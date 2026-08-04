import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ToolNotFound() {
  return (
    <main className="container flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <h1 className="text-2xl font-bold">Tool not found</h1>
      <p className="max-w-sm text-muted-foreground">
        This tool may have been removed or the link is incorrect.
      </p>
      <Button asChild>
        <Link href="/tools">Browse all tools</Link>
      </Button>
    </main>
  );
}
