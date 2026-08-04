import { z } from "zod";

export const pricingModelEnum = z.enum([
  "FREE",
  "FREEMIUM",
  "PAID",
  "SUBSCRIPTION",
  "ONE_TIME",
  "OPEN_SOURCE",
  "CONTACT_SALES",
]);

export const toolStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const toolFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(120),
  slug: z
    .string()
    .min(2)
    .max(140)
    .regex(slugRegex, "Slug must be lowercase, alphanumeric, dash-separated"),
  tagline: z.string().max(160).optional(),
  description: z.string().min(20, "Description must be at least 20 characters").max(500),
  longDescription: z.string().max(20000).optional(),
  logoUrl: z.string().url().optional().or(z.literal("")),
  websiteUrl: z.string().url("Must be a valid URL"),
  affiliateUrl: z.string().url().optional().or(z.literal("")),
  pricingModel: pricingModelEnum,
  startingPrice: z.coerce.number().nonnegative().optional(),
  currency: z.string().length(3).optional(),
  status: toolStatusEnum,
  isFeatured: z.boolean().default(false),
  isVerified: z.boolean().default(false),
  categoryId: z.string().cuid("Category is required"),
  subcategoryId: z.string().cuid().optional().nullable(),
  companyId: z.string().cuid().optional().nullable(),
  tagIds: z.array(z.string().cuid()).default([]),
  platformIds: z.array(z.string().cuid()).default([]),

  metaTitle: z.string().max(70).optional(),
  metaDescription: z.string().max(160).optional(),
});

export type ToolFormInput = z.infer<typeof toolFormSchema>;

export const searchQuerySchema = z.object({
  q: z.string().trim().max(200).optional(),
  category: z.string().max(140).optional(),
  tag: z.string().max(140).optional(),
  platform: z.string().max(140).optional(),
  pricing: pricingModelEnum.optional(),
  sort: z.enum(["newest", "popular", "az", "za"]).default("popular"),
  page: z.coerce.number().int().positive().default(1),
});

export type SearchQueryInput = z.infer<typeof searchQuerySchema>;
