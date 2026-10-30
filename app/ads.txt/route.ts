import { getAdSettings } from "@/lib/ads/settings";
import { adsTxtLine, validAdsensePubId } from "@/lib/ads/config";

export const revalidate = 300;

export async function GET() {
  const { adsensePubId } = await getAdSettings();
  const pubId = validAdsensePubId(adsensePubId);
  if (!pubId) return new Response("Not found", { status: 404 });

  return new Response(`${adsTxtLine(pubId)}\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
