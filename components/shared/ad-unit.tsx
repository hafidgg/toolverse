"use client";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdUnit({ clientId, slotId }: { clientId: string; slotId: string }) {
  const ref = useRef<HTMLModElement>(null);

  useEffect(() => {
    const el = ref.current;
    // AdSense marks initialized units with data-adsbygoogle-status; pushing
    // twice for the same <ins> (e.g. StrictMode double effects) throws.
    if (!el || el.dataset.adsbygoogleStatus) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Ad blockers or a missing script must never break the page.
    }
  }, []);

  return (
    <ins
      ref={ref}
      className="adsbygoogle block"
      data-ad-client={clientId}
      data-ad-slot={slotId}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}
