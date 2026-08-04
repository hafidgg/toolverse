"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toolFormSchema, type ToolFormInput } from "@/lib/validators/tool";
import { createTool, updateTool } from "@/actions/admin/tool-actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

interface Option {
  id: string;
  name: string;
}

export function ToolForm({
  toolId,
  defaultValues,
  categories,
  companies,
}: {
  toolId?: string;
  defaultValues?: Partial<ToolFormInput>;
  categories: Option[];
  companies: Option[];
}) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ToolFormInput>({
    resolver: zodResolver(toolFormSchema),
    defaultValues: {
      status: "DRAFT",
      pricingModel: "FREE",
      isFeatured: false,
      isVerified: false,
      tagIds: [],
      platformIds: [],
      ...defaultValues,
    },
  });

  function onSubmit(data: ToolFormInput) {
    startTransition(async () => {
      try {
        if (toolId) {
          await updateTool(toolId, data);
          toast({ title: "Tool updated" });
        } else {
          const result = await createTool(data);
          toast({ title: "Tool created" });
          router.push(`/admin/tools/${result.toolId}`);
          return;
        }
        router.refresh();
      } catch (err) {
        toast({ title: "Something went wrong", description: String(err), variant: "destructive" });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-3xl space-y-8">
      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Basics</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register("name")} />
            {errors.name && <p className="mt-1 text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div>
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" {...register("slug")} />
            {errors.slug && <p className="mt-1 text-xs text-destructive">{errors.slug.message}</p>}
          </div>
        </div>

        <div>
          <Label htmlFor="tagline">Tagline</Label>
          <Input id="tagline" {...register("tagline")} placeholder="A short one-liner" />
        </div>

        <div>
          <Label htmlFor="description">Short Description</Label>
          <Textarea id="description" {...register("description")} rows={3} />
          {errors.description && (
            <p className="mt-1 text-xs text-destructive">{errors.description.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="longDescription">Long Description</Label>
          <Textarea id="longDescription" {...register("longDescription")} rows={8} />
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Links & Media</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input id="websiteUrl" {...register("websiteUrl")} />
            {errors.websiteUrl && (
              <p className="mt-1 text-xs text-destructive">{errors.websiteUrl.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input id="logoUrl" {...register("logoUrl")} placeholder="Uploaded via Media Library" />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Pricing</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <Label>Pricing Model</Label>
            <Select
              defaultValue={defaultValues?.pricingModel ?? "FREE"}
              onValueChange={(v) => setValue("pricingModel", v as ToolFormInput["pricingModel"])}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["FREE", "FREEMIUM", "PAID", "SUBSCRIPTION", "ONE_TIME", "OPEN_SOURCE", "CONTACT_SALES"].map((v) => (
                  <SelectItem key={v} value={v}>{v}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="startingPrice">Starting Price</Label>
            <Input id="startingPrice" type="number" step="0.01" {...register("startingPrice")} />
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Input id="currency" {...register("currency")} placeholder="USD" maxLength={3} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Taxonomy</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Category</Label>
            <Select
              defaultValue={defaultValues?.categoryId}
              onValueChange={(v) => setValue("categoryId", v)}
            >
              <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.categoryId && (
              <p className="mt-1 text-xs text-destructive">{errors.categoryId.message}</p>
            )}
          </div>
          <div>
            <Label>Company</Label>
            <Select
              defaultValue={defaultValues?.companyId ?? undefined}
              onValueChange={(v) => setValue("companyId", v)}
            >
              <SelectTrigger><SelectValue placeholder="Select company" /></SelectTrigger>
              <SelectContent>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">Publishing</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Status</Label>
            <Select
              defaultValue={defaultValues?.status ?? "DRAFT"}
              onValueChange={(v) => setValue("status", v as ToolFormInput["status"])}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-6 pt-6">
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={watch("isFeatured")}
                onCheckedChange={(v) => setValue("isFeatured", Boolean(v))}
              />
              Featured
            </label>
            <label className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={watch("isVerified")}
                onCheckedChange={(v) => setValue("isVerified", Boolean(v))}
              />
              Verified
            </label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-muted-foreground">SEO</h2>
        <div>
          <Label htmlFor="metaTitle">Meta Title</Label>
          <Input id="metaTitle" {...register("metaTitle")} maxLength={70} />
        </div>
        <div>
          <Label htmlFor="metaDescription">Meta Description</Label>
          <Textarea id="metaDescription" {...register("metaDescription")} maxLength={160} rows={2} />
        </div>
      </section>

      <div className="flex gap-3 border-t pt-6">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : toolId ? "Save changes" : "Create tool"}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.push("/admin/tools")}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
