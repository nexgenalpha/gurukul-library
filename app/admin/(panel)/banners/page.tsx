"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, X, ArrowUp, ArrowDown } from "lucide-react";

interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  media_id: string | null;
  button_text: string | null;
  button_url: string | null;
  start_date: string | null;
  end_date: string | null;
  is_active: boolean;
  display_order: number;
  media?: { public_url: string } | null;
}

interface MediaOption {
  id: string;
  public_url: string;
}

export default function AdminBannersPage() {
  const supabase = createClient();
  const [items, setItems] = useState<Banner[]>([]);
  const [mediaOptions, setMediaOptions] = useState<MediaOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Banner | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: media }] = await Promise.all([
      supabase.from("banners").select("*, media:media_id(public_url)").order("display_order"),
      supabase.from("media").select("id, public_url").eq("category", "banner").eq("is_active", true),
    ]);
    setItems((data as unknown as Banner[]) ?? []);
    setMediaOptions((media as MediaOption[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(item: Banner) {
    await supabase.from("banners").update({ is_active: !item.is_active }).eq("id", item.id);
    load();
  }

  async function handleDelete(item: Banner) {
    if (!confirm(`Delete banner "${item.title}"?`)) return;
    await supabase.from("banners").delete().eq("id", item.id);
    load();
  }

  async function move(item: Banner, direction: "up" | "down") {
    const index = items.findIndex((p) => p.id === item.id);
    const swapWith = direction === "up" ? items[index - 1] : items[index + 1];
    if (!swapWith) return;
    await Promise.all([
      supabase.from("banners").update({ display_order: swapWith.display_order }).eq("id", item.id),
      supabase.from("banners").update({ display_order: item.display_order }).eq("id", swapWith.id),
    ]);
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-800">Banners</h1>
          <p className="mt-1 text-sm text-navy-800/60">
            Upload the banner image in Media Manager (category "Banner") first, then create it here.
          </p>
        </div>
        <button onClick={() => { setEditing(undefined); setModalOpen(true); }} className="btn-primary">
          <Plus size={16} className="mr-2" /> New Banner
        </button>
      </div>

      {loading ? (
        <p className="mt-10 text-navy-800/50">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-10 text-navy-800/50">No banners yet.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {items.map((item, i) => (
            <div key={item.id} className="overflow-hidden rounded-xl2 bg-white shadow-card">
              {item.media?.public_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.media.public_url} alt="" className="h-32 w-full object-cover" />
              )}
              <div className="p-4">
                <p className="font-medium text-navy-800">{item.title}</p>
                {item.subtitle && <p className="text-sm text-navy-800/60">{item.subtitle}</p>}
                <div className="mt-3 flex items-center gap-2">
                  <button disabled={i === 0} onClick={() => move(item, "up")} className="text-navy-800/40 hover:text-navy-800 disabled:opacity-20">
                    <ArrowUp size={14} />
                  </button>
                  <button disabled={i === items.length - 1} onClick={() => move(item, "down")} className="text-navy-800/40 hover:text-navy-800 disabled:opacity-20">
                    <ArrowDown size={14} />
                  </button>
                  <button
                    onClick={() => toggleActive(item)}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                      item.is_active ? "bg-green-100 text-green-700" : "bg-navy-100 text-navy-800/60"
                    }`}
                  >
                    {item.is_active ? "Active" : "Inactive"}
                  </button>
                  <button onClick={() => { setEditing(item); setModalOpen(true); }} className="ml-auto rounded p-1.5 text-navy-800/60 hover:bg-navy-50">
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => handleDelete(item)} className="rounded p-1.5 text-red-600 hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <BannerModal
          banner={editing}
          mediaOptions={mediaOptions}
          nextOrder={items.length}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function BannerModal({
  banner,
  mediaOptions,
  nextOrder,
  onClose,
  onSaved,
}: {
  banner?: Banner;
  mediaOptions: MediaOption[];
  nextOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [title, setTitle] = useState(banner?.title ?? "");
  const [subtitle, setSubtitle] = useState(banner?.subtitle ?? "");
  const [mediaId, setMediaId] = useState(banner?.media_id ?? "");
  const [buttonText, setButtonText] = useState(banner?.button_text ?? "");
  const [buttonUrl, setButtonUrl] = useState(banner?.button_url ?? "");
  const [isActive, setIsActive] = useState(banner?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    const payload = {
      title: title.trim(),
      subtitle: subtitle.trim() || null,
      media_id: mediaId || null,
      button_text: buttonText.trim() || null,
      button_url: buttonUrl.trim() || null,
      is_active: isActive,
    };
    const query = banner
      ? supabase.from("banners").update(payload).eq("id", banner.id)
      : supabase.from("banners").insert({ ...payload, display_order: nextOrder });
    const { error: saveError } = await query;
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-4">
      <div className="w-full max-w-md rounded-xl2 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-navy-800">{banner ? "Edit Banner" : "New Banner"}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Title</span>
            <input required className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Subtitle (optional)</span>
            <input className="input mt-1" value={subtitle} onChange={(e) => setSubtitle(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Image</span>
            <select className="input mt-1" value={mediaId} onChange={(e) => setMediaId(e.target.value)}>
              <option value="">— None —</option>
              {mediaOptions.map((m) => (
                <option key={m.id} value={m.id}>{m.public_url.split("/").pop()}</option>
              ))}
            </select>
            {mediaOptions.length === 0 && (
              <p className="mt-1 text-xs text-navy-800/50">
                No banner images uploaded yet — add one in Media Manager first.
              </p>
            )}
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-navy-800">Button Text</span>
              <input className="input mt-1" value={buttonText} onChange={(e) => setButtonText(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-navy-800">Button URL</span>
              <input className="input mt-1" value={buttonUrl} onChange={(e) => setButtonUrl(e.target.value)} />
            </label>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <span className="text-sm text-navy-800">Active</span>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
