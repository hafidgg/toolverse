"use client";

import { useState, useTransition, useEffect } from "react";
import Image from "next/image";
import { Upload, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadMedia, deleteMedia } from "@/actions/admin/media-actions";
import { useToast } from "@/hooks/use-toast";

interface MediaItem {
  id: string;
  secureUrl: string;
  width: number | null;
  height: number | null;
  format: string | null;
  bytes: number | null;
  createdAt: string;
}

export default function MediaLibraryPage() {
  const { toast } = useToast();
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  async function loadMedia() {
    setLoading(true);
    const res = await fetch("/api/admin/media");
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }

  useEffect(() => {
    loadMedia();
  }, []);

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.set("file", file);

    startTransition(async () => {
      try {
        await uploadMedia(formData);
        toast({ title: "Image uploaded" });
        loadMedia();
      } catch (err) {
        toast({ title: "Upload failed", description: String(err), variant: "destructive" });
      }
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteMedia(id);
      toast({ title: "Image deleted" });
      loadMedia();
    });
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Media Library</h1>
          <p className="mt-1 text-sm text-muted-foreground">Images are stored on Cloudinary.</p>
        </div>
        <label>
          <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={isPending} />
          <Button asChild disabled={isPending}>
            <span>
              <Upload className="mr-2 h-4 w-4" /> {isPending ? "Uploading…" : "Upload Image"}
            </span>
          </Button>
        </label>
      </div>

      <div className="mt-6">
        {loading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-lg bg-muted" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No media uploaded yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
            {items.map((item) => (
              <div key={item.id} className="group relative aspect-square overflow-hidden rounded-lg border bg-muted">
                <Image src={item.secureUrl} alt="" fill className="object-cover" />
                <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(item.secureUrl);
                      toast({ title: "URL copied" });
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="destructive" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
