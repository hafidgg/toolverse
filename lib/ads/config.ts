// Pure AdSense config validation — kept free of server/DB imports so it can be
// unit tested and shared between the AdSlot component and the ads.txt route.

const CLIENT_ID_RE = /^ca-pub-\d{10,20}$/;
const PUB_ID_RE = /^pub-\d{10,20}$/;
const SLOT_ID_RE = /^\d{6,20}$/;

export type AdPlacement = "banner" | "in-content" | "sidebar";

/** Returns the AdSense client ID ("ca-pub-…") if well-formed, else null. */
export function validAdsenseClientId(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v && CLIENT_ID_RE.test(v) ? v : null;
}

/** Accepts "pub-…" or "ca-pub-…" and returns the "pub-…" form, else null. */
export function validAdsensePubId(value: string | null | undefined): string | null {
  const v = value?.trim().replace(/^ca-/, "");
  return v && PUB_ID_RE.test(v) ? v : null;
}

export function validAdSlotId(value: string | null | undefined): string | null {
  const v = value?.trim();
  return v && SLOT_ID_RE.test(v) ? v : null;
}

// NEXT_PUBLIC_* vars must be referenced literally so Next.js can inline them.
export function adSlotIdFor(placement: AdPlacement): string | null {
  switch (placement) {
    case "banner":
      return validAdSlotId(process.env.NEXT_PUBLIC_ADSENSE_SLOT_BANNER);
    case "in-content":
      return validAdSlotId(process.env.NEXT_PUBLIC_ADSENSE_SLOT_IN_CONTENT);
    case "sidebar":
      return validAdSlotId(process.env.NEXT_PUBLIC_ADSENSE_SLOT_SIDEBAR);
  }
}

/** Google's ads.txt line for a direct AdSense relationship. */
export function adsTxtLine(pubId: string): string {
  return `google.com, ${pubId}, DIRECT, f08c47fec0942fa0`;
}
