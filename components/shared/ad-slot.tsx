import { getAdSettings } from "@/lib/ads/settings";
import { adSlotIdFor, validAdsenseClientId, type AdPlacement } from "@/lib/ads/config";
import { AdUnit } from "./ad-unit";

interface AdSlotProps {
  placement: AdPlacement;
  className?: string;
  format?: "horizontal" | "square" | "vertical";
}

const FORMAT_HEIGHT: Record<NonNullable<AdSlotProps["format"]>, string> = {
  horizontal: "min-h-[100px]",
  square: "min-h-[250px]",
  vertical: "min-h-[600px]",
};

// Renders a real AdSense unit only when both the client ID (Settings) and the
// placement's slot ID (NEXT_PUBLIC_ADSENSE_SLOT_*) are configured and valid.
// Otherwise renders nothing — visitors never see placeholder "ad" boxes, and
// callers pass spacing via className so no empty margin or wrapper remains.
// The adsbygoogle.js script itself is loaded once, globally, by AnalyticsScripts.
export async function AdSlot({ placement, className, format = "horizontal" }: AdSlotProps) {
  const slotId = adSlotIdFor(placement);
  if (!slotId) return null;
  const { adsenseClientId } = await getAdSettings();
  const clientId = validAdsenseClientId(adsenseClientId);
  if (!clientId) return null;

  return (
    <aside aria-label="Advertisement" className={`${FORMAT_HEIGHT[format]} ${className ?? ""}`}>
      <p className="mb-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
        Advertisement
      </p>
      <AdUnit clientId={clientId} slotId={slotId} />
    </aside>
  );
}
