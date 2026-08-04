"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { deleteTool } from "@/actions/admin/tool-actions";
import { useToast } from "@/hooks/use-toast";

export function ToolRowActions({ toolId, slug }: { toolId: string; slug: string }) {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <div className="flex items-center justify-end gap-1">
      <Button variant="ghost" size="icon" asChild aria-label="View live">
        <a href={`/tools/${slug}`} target="_blank" rel="noopener noreferrer">
          <ExternalLink className="h-4 w-4" />
        </a>
      </Button>
      <Button variant="ghost" size="icon" asChild aria-label="Edit">
        <Link href={`/admin/tools/${toolId}`}>
          <Pencil className="h-4 w-4" />
        </Link>
      </Button>
      <ConfirmDeleteButton
        entityLabel="tool"
        onConfirm={async () => {
          await deleteTool(toolId);
          toast({ title: "Tool deleted" });
          router.refresh();
        }}
      />
    </div>
  );
}
