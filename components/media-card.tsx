"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { replaceMedia, deleteMedia } from "@/lib/media";
import type { Media, MediaCategory } from "@/types/database";
import { Trash2, RefreshCw, Check, X } from "lucide-react";

export function MediaCard({ item, onChanged }: { item: Media; onChanged: () => void }) {
  const supabase = createClient();
  const fileInput = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [altText, setAltText] = useState(item.alt_text ?? "");
  const [caption, setCaption] = useState(item.caption ?? "");

  async function handleReplace(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      await replaceMedia(
        supabase,
        item.id,
        item.storage_bucket,
        item.storage_path,
        file,
        item.category as MediaCategory
      );
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Replace failed");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Delete this image? This can't be undone.")) return;
    setBusy(true);
    try {
      await deleteMedia(supabase, item.id, item.storage_bucket, item.storage_path);
      onChanged();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setBusy(false);
    }
  }

  async function toggleActive() {
    setBusy(true);
    await supabase.from("media").update({ is_active: !item.is_active }).eq("id", item.id);
    setBusy(false);
    onChanged();
  }

  async function saveDetails() {
    setBusy(true);
    await supabase.from("media").update({ alt_text: altText, caption }).eq("id", item.id);
    setBusy(false);
    setEditing(false);
    onChanged();
  }

  return (
    <div className="overflow-hidden rounded-xl2 bg-white shadow-card">
      <div className="relative aspect-video bg-navy-50">
        <Image src={item.public_url} alt={item.alt_text ?? ""} fill className="object-cover" unoptimized />
        {!item.is_active && (
          <span className="absolute left-2 top-2 rounded-full bg-navy-900/80 px-2 py-0.5 text-xs text-white">
            Inactive
          </span>
        )}
      </div>

      <div className="p-4">
        {editing ? (
          <div className="space-y-2">
            <input
              className="input text-sm"
              placeholder="Alt text"
              value={altText}
              onChange={(e) => setAltText(e.target.value)}
            />
            <input
              className="input text-sm"
              placeholder="Caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
            />
            <div className="flex gap-2">
              <button onClick={saveDetails} disabled={busy} className="btn-primary flex-1 py-1.5 text-xs">
                <Check size={14} className="mr-1" /> Save
              </button>
              <button onClick={() => setEditing(false)} className="btn-secondary flex-1 py-1.5 text-xs">
                <X size={14} className="mr-1" /> Cancel
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="truncate text-sm font-medium text-navy-800">
              {item.caption || item.storage_path.split("/").pop()}
            </p>
            <p className="text-xs capitalize text-navy-800/50">{item.category}</p>

            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={() => setEditing(true)} className="btn-secondary px-3 py-1.5 text-xs">
                Edit
              </button>
              <button
                onClick={() => fileInput.current?.click()}
                disabled={busy}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                <RefreshCw size={12} className="mr-1 inline" /> Replace
              </button>
              <input ref={fileInput} type="file" accept="image/*" hidden onChange={handleReplace} />
              <button
                onClick={toggleActive}
                disabled={busy}
                className="btn-secondary px-3 py-1.5 text-xs"
              >
                {item.is_active ? "Disable" : "Enable"}
              </button>
              <button
                onClick={handleDelete}
                disabled={busy}
                className="ml-auto rounded-full p-1.5 text-red-600 hover:bg-red-50"
                aria-label="Delete"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
