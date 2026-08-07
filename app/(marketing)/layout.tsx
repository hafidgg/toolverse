import { unstable_cache } from "next/cache";
import { SiteHeader } from "@/components/shared/site-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { prisma } from "@/lib/db/client";

// Cached short-lived so toggling maintenance mode in the admin panel takes
// effect within ~30s across all serverless instances, without hitting the
// database on every single page view.
const getMaintenanceMode = unstable_cache(
  async () => {
    const settings = await prisma.settings.findUnique({
      where: { id: "global" },
      select: { maintenanceMode: true },
    });
    return settings?.maintenanceMode ?? false;
  },
  ["maintenance-mode"],
  { revalidate: 30, tags: ["settings"] }
);

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const maintenanceMode = await getMaintenanceMode();

  if (maintenanceMode) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
        <h1 className="text-2xl font-bold">We&apos;ll be right back</h1>
        <p className="mt-2 max-w-sm text-muted-foreground">
          ToolVerse is undergoing scheduled maintenance. Please check back shortly.
        </p>
      </div>
    );
  }

  return (
    <>
      <SiteHeader />
      <div className="min-h-[70vh]">{children}</div>
      <SiteFooter />
    </>
  );
}