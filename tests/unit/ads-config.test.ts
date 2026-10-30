import { describe, it, expect } from "vitest";
import { adsTxtLine, validAdSlotId, validAdsenseClientId, validAdsensePubId } from "@/lib/ads/config";

describe("AdSense config validation", () => {
  it("validates client IDs", () => {
    expect(validAdsenseClientId("ca-pub-1234567890123456")).toBe("ca-pub-1234567890123456");
    expect(validAdsenseClientId("pub-1234567890123456")).toBeNull();
    expect(validAdsenseClientId("ca-pub-XXXX")).toBeNull();
    expect(validAdsenseClientId(null)).toBeNull();
  });

  it("normalizes publisher IDs and builds the ads.txt line", () => {
    expect(validAdsensePubId("ca-pub-1234567890123456")).toBe("pub-1234567890123456");
    expect(validAdsensePubId("pub-123\nevil.com, x")).toBeNull();
    expect(adsTxtLine("pub-1234567890123456")).toBe(
      "google.com, pub-1234567890123456, DIRECT, f08c47fec0942fa0"
    );
  });

  it("validates slot IDs", () => {
    expect(validAdSlotId("1234567890")).toBe("1234567890");
    expect(validAdSlotId("abc")).toBeNull();
    expect(validAdSlotId("")).toBeNull();
  });
});
