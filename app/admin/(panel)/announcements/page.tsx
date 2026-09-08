"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, X } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  description: string | null;
  publish_date: string;
  expiry_date: string | null;
  is_active: boolean;
}

export default function AdminAnnouncementsPage() {
  const supabase = createClient();
  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Announcement | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("announcements").select("*").order("publish_date", { ascending: false });
    setItems((data as Announcement[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(item: Announcement) {
    await supabase.from("announcements").update({ is_active: !item.is_active }).eq("id", item.id);
    load();
  }

  async function handleDelete(item: Announcement) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await supabase.from("announcements").delete().eq("id", item.id);
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-800">Announcements</h1>
          <p className="mt-1 text-sm text-navy-800/60">Shown on the homepage and student dashboard.</p>
        </div>
        <button onClick={() => { setEditing(undefined); setModalOpen(true); }} className="btn-primary">
          <Plus size={16} className="mr-2" /> New Announcement
        </button>
      </div>

      {loading ? (
        <p className="mt-10 text-navy-800/50">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-10 text-navy-800/50">No announcements yet.</p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl2 bg-white shadow-card">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-4 border-b border-navy-50 px-5 py-4 last:border-0">
              <div className="flex-1">
                <p className="font-medium text-navy-800">{item.title}</p>
                {item.description && <p className="mt-1 text-sm text-navy-800/60">{item.description}</p>}
                <p className="mt-1 text-xs text-navy-800/40">
                  Publishes {item.publish_date}
                  {item.expiry_date ? ` — expires ${item.expiry_date}` : ""}
                </p>
              </div>
              <button
                onClick={() => toggleActive(item)}
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                  item.is_active ? "bg-green-100 text-green-700" : "bg-navy-100 text-navy-800/60"
                }`}
              >
                {item.is_active ? "Active" : "Inactive"}
              </button>
              <button onClick={() => { setEditing(item); setModalOpen(true); }} className="rounded p-1.5 text-navy-800/60 hover:bg-navy-50">
                <Pencil size={16} />
              </button>
              <button onClick={() => handleDelete(item)} className="rounded p-1.5 text-red-600 hover:bg-red-50">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <AnnouncementModal
          announcement={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function AnnouncementModal({
  announcement,
  onClose,
  onSaved,
}: {
  announcement?: Announcement;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [title, setTitle] = useState(announcement?.title ?? "");
  const [description, setDescription] = useState(announcement?.description ?? "");
  const [publishDate, setPublishDate] = useState(announcement?.publish_date ?? today);
  const [expiryDate, setExpiryDate] = useState(announcement?.expiry_date ?? "");
  const [isActive, setIsActive] = useState(announcement?.is_active ?? true);
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
      description: description.trim() || null,
      publish_date: publishDate,
      expiry_date: expiryDate || null,
      is_active: isActive,
    };
    const query = announcement
      ? supabase.from("announcements").update(payload).eq("id", announcement.id)
      : supabase.from("announcements").insert(payload);
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
          <h2 className="font-serif text-lg font-semibold text-navy-800">
            {announcement ? "Edit Announcement" : "New Announcement"}
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Title</span>
            <input required className="input mt-1" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Description (optional)</span>
            <textarea className="input mt-1 min-h-[80px]" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-navy-800">Publish Date</span>
              <input type="date" className="input mt-1" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-navy-800">Expiry Date (optional)</span>
              <input type="date" className="input mt-1" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
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
