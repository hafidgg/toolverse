import "server-only";
import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/db/client";

// Same source as the global AdSense script (components/shared/analytics-scripts.tsx).
// Cached briefly and tagged "settings" like the maintenance-mode lookup.
export const getAdSettings = unstable_cache(
  async () => {
    const settings = await prisma.settings
      .findUnique({
        where: { id: "global" },
        select: { adsenseClientId: true, adsensePubId: true },
      })
      .catch(() => null);
    return {
      adsenseClientId: settings?.adsenseClientId ?? null,
      adsensePubId: settings?.adsensePubId ?? null,
    };
  },
  ["ad-settings"],
  { revalidate: 300, tags: ["settings"] }
);
