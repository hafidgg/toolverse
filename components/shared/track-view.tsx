"use client";

import { useEffect } from "react";

// Pages are statically cached (ISR), so views can't be counted while
// rendering. This sends one first-party page_view per entity per browser
// session: no cookies, no third parties. Storage can be unavailable (private
// windows, blocked site data); then every visit counts, which is acceptable.
export function TrackView({ entityType, entityId }: { entityType: "tool"; entityId: string }) {
  useEffect(() => {
    const key = `tv:viewed:${entityType}:${entityId}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // ignore
    }

    const body = JSON.stringify({
      eventType: "page_view",
      entityType,
      entityId,
      path: window.location.pathname,
    });
    try {
      const blob = new Blob([body], { type: "application/json" });
      if (navigator.sendBeacon?.("/api/public/track", blob)) return;
    } catch {
      // fall through to fetch
    }
    fetch("/api/public/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    }).catch(() => {});
  }, [entityType, entityId]);

  return null;
}
