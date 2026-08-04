import Link from "next/link";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";

export interface ToolCardData {
  id: string;
  name: string;
  slug: string;
  tagline?: string | null;
  logoUrl?: string | null;
  pricingModel: string;
  category?: { name: string; slug: string } | null;
}

const PRICING_LABEL: Record<string, string> = {
  FREE: "Free",
  FREEMIUM: "Freemium",
  PAID: "Paid",
  SUBSCRIPTION: "Subscription",
  ONE_TIME: "One-time",
  OPEN_SOURCE: "Open Source",
  CONTACT_SALES: "Contact Sales",
};

export function ToolCard({ tool }: { tool: ToolCardData }) {
  return (
    <Link
      href={`/tools/${tool.slug}`}
      className="group flex flex-col rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border bg-muted overflow-hidden">
          {tool.logoUrl ? (
            <Image src={tool.logoUrl} alt={`${tool.name} logo`} width={44} height={44} />
          ) : (
            <span className="text-sm font-semibold text-muted-foreground">
              {tool.name.slice(0, 2).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <h3 className="truncate font-semibold group-hover:text-primary">{tool.name}</h3>
          {tool.category && (
            <p className="truncate text-xs text-muted-foreground">{tool.category.name}</p>
          )}
        </div>
      </div>

      {tool.tagline && (
        <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{tool.tagline}</p>
      )}

      <div className="mt-4">
        <Badge variant="secondary">{PRICING_LABEL[tool.pricingModel] ?? tool.pricingModel}</Badge>
      </div>
    </Link>
  );
}
