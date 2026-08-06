import { prisma } from "@/lib/db/client";
import { updateSettingsFromForm } from "@/actions/admin/content-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChangePasswordForm } from "@/components/admin/change-password-form";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await prisma.settings.findUnique({ where: { id: "global" } });

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">Global site configuration.</p>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Your Account</CardTitle>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>

      <form action={updateSettingsFromForm} className="mt-6 space-y-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Site</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="siteName">Site Name</Label>
              <Input id="siteName" name="siteName" defaultValue={settings?.siteName ?? "ToolVerse"} required />
            </div>
            <div>
              <Label htmlFor="siteDescription">Site Description</Label>
              <Textarea id="siteDescription" name="siteDescription" defaultValue={settings?.siteDescription ?? ""} rows={2} />
            </div>
            <div>
              <Label htmlFor="siteUrl">Site URL</Label>
              <Input id="siteUrl" name="siteUrl" defaultValue={settings?.siteUrl ?? ""} placeholder="https://toolverse.example.com" />
            </div>
            <div>
              <Label htmlFor="contactEmail">Contact Email</Label>
              <Input id="contactEmail" name="contactEmail" type="email" defaultValue={settings?.contactEmail ?? ""} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Default SEO</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="defaultMetaTitle">Default Meta Title</Label>
              <Input id="defaultMetaTitle" name="defaultMetaTitle" defaultValue={settings?.defaultMetaTitle ?? ""} maxLength={70} />
            </div>
            <div>
              <Label htmlFor="defaultMetaDescription">Default Meta Description</Label>
              <Textarea id="defaultMetaDescription" name="defaultMetaDescription" defaultValue={settings?.defaultMetaDescription ?? ""} maxLength={160} rows={2} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Analytics & Ads</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label htmlFor="googleAnalyticsId">Google Analytics ID</Label>
              <Input id="googleAnalyticsId" name="googleAnalyticsId" defaultValue={settings?.googleAnalyticsId ?? ""} placeholder="G-XXXXXXX" />
            </div>
            <div>
              <Label htmlFor="googleSearchConsoleId">Search Console Verification</Label>
              <Input id="googleSearchConsoleId" name="googleSearchConsoleId" defaultValue={settings?.googleSearchConsoleId ?? ""} />
            </div>
            <div>
              <Label htmlFor="adsenseClientId">AdSense Client ID</Label>
              <Input id="adsenseClientId" name="adsenseClientId" defaultValue={settings?.adsenseClientId ?? ""} placeholder="ca-pub-XXXXXXXXXX" />
            </div>
            <div>
              <Label htmlFor="adsensePubId">AdSense Publisher ID</Label>
              <Input id="adsensePubId" name="adsensePubId" defaultValue={settings?.adsensePubId ?? ""} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Maintenance</CardTitle></CardHeader>
          <CardContent>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="maintenanceMode"
                defaultChecked={settings?.maintenanceMode ?? false}
                className="h-4 w-4 rounded border"
              />
              Enable maintenance mode
            </label>
          </CardContent>
        </Card>

        <Button type="submit">Save Settings</Button>
      </form>
    </div>
  );
}