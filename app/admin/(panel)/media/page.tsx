"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadMedia } from "@/lib/media";
import { MediaCard } from "@/components/media-card";
import type { Media, MediaCategory } from "@/types/database";
import { Upload } from "lucide-react";

const FILTERS: { label: string; value: MediaCategory | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Hero", value: "hero" },
  { label: "Gallery", value: "gallery" },
  { label: "Banner", value: "banner" },
  { label: "Facility", value: "facility" },
  { label: "About", value: "about" },
  { label: "Promo", value: "promo" },
  { label: "Other", value: "other" },
];

export default function MediaManagerPage() {
  const supabase = createClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState<Media[]>([]);
  const [filter, setFilter] = useState<MediaCategory | "all">("all");
  const [uploadCategory, setUploadCategory] = useState<MediaCategory>("gallery");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("media").select("*").order("display_order").order("created_at", { ascending: false });
    setItems((data as Media[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        await uploadMedia(supabase, file, uploadCategory, user.id);
      }
      await load();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  const visible = filter === "all" ? items : items.filter((i) => i.category === filter);

  return (
    <div className="p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-800">Media Manager</h1>
          <p className="mt-1 text-sm text-navy-800/60">
            Every image on the public site — hero, gallery, facilities, banners — is managed here.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            className="input w-40 py-2 text-sm"
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value as MediaCategory)}
          >
            {FILTERS.filter((f) => f.value !== "all").map((f) => (
              <option key={f.value} value={f.value}>
                {f.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => fileInput.current?.click()}
            disabled={uploading}
            className="btn-primary"
          >
            <Upload size={16} className="mr-2" />
            {uploading ? "Uploading…" : "Upload"}
          </button>
          <input
            ref={fileInput}
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={handleUpload}
          />
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              filter === f.value
                ? "bg-navy-600 text-white"
                : "bg-white text-navy-800/70 hover:bg-navy-50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-10 text-navy-800/50">Loading media…</p>
      ) : visible.length === 0 ? (
        <p className="mt-10 text-navy-800/50">
          No images in this category yet. Upload one to get started.
        </p>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {visible.map((item) => (
            <MediaCard key={item.id} item={item} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}
