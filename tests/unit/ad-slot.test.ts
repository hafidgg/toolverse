import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const getAdSettings = vi.fn();
vi.mock("@/lib/ads/settings", () => ({ getAdSettings: () => getAdSettings() }));
vi.mock("@/components/shared/ad-unit", () => ({ AdUnit: () => null }));

const { AdSlot } = await import("@/components/shared/ad-slot");

describe("AdSlot", () => {
  beforeEach(() => {
    getAdSettings.mockResolvedValue({ adsenseClientId: "ca-pub-1234567890123456", adsensePubId: null });
  });
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("renders nothing (no wrapper, no reserved space) without a slot ID", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_SLOT_BANNER", "");
    expect(await AdSlot({ placement: "banner", className: "my-8" })).toBeNull();
  });

  it("renders nothing without a valid client ID", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_SLOT_BANNER", "1234567890");
    getAdSettings.mockResolvedValue({ adsenseClientId: "not-a-client", adsensePubId: null });
    expect(await AdSlot({ placement: "banner" })).toBeNull();
  });

  it("renders a labelled container with the caller's spacing when configured", async () => {
    vi.stubEnv("NEXT_PUBLIC_ADSENSE_SLOT_BANNER", "1234567890");
    const el = await AdSlot({ placement: "banner", className: "my-8" });
    expect(el).not.toBeNull();
    expect(el?.props["aria-label"]).toBe("Advertisement");
    expect(el?.props.className).toContain("my-8");
  });
});
