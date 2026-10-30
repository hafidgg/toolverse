import { z } from "zod";
import { pricingModelEnum } from "./tool";

export const TOOL_SORT_OPTIONS = ["popular", "newest", "az", "za"] as const;
export type ToolSort = (typeof TOOL_SORT_OPTIONS)[number];

type RawParam = string | string[] | undefined;

// Each field is parsed independently with `.catch(undefined)` so one bad value
// (e.g. ?pricing=INVALID) is dropped without discarding the valid ones.
const filterSlug = z.string().trim().min(1).max(100).optional().catch(undefined);

const toolsQuerySchema = z.object({
  category: filterSlug,
  tag: filterSlug,
  platform: filterSlug,
  pricing: pricingModelEnum.optional().catch(undefined),
  sort: z.enum(TOOL_SORT_OPTIONS).optional().catch(undefined),
  page: z.coerce.number().int().min(1).max(10_000).optional().catch(undefined),
});

export interface ToolsQuery {
  category?: string;
  tag?: string;
  platform?: string;
  pricing?: z.infer<typeof pricingModelEnum>;
  sort?: ToolSort;
  page: number;
}

export function parseToolsQuery(raw: Record<string, RawParam>): ToolsQuery {
  // Repeated params (?page=1&page=2) arrive as arrays — only trust single values.
  const single = (v: RawParam) => (typeof v === "string" ? v : undefined);
  const parsed = toolsQuerySchema.parse({
    category: single(raw.category),
    tag: single(raw.tag),
    platform: single(raw.platform),
    pricing: single(raw.pricing),
    sort: single(raw.sort),
    // Strict digits only: z.coerce would otherwise accept "1e3" or " 2 ".
    page: /^\d+$/.test(single(raw.page) ?? "") ? single(raw.page) : undefined,
  });
  return { ...parsed, page: parsed.page ?? 1 };
}
