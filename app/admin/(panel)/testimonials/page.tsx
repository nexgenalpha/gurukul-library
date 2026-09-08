"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, X, Star } from "lucide-react";

interface Testimonial {
  id: string;
  name: string;
  review: string;
  rating: number | null;
  is_active: boolean;
}

export default function AdminTestimonialsPage() {
  const supabase = createClient();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Testimonial | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("testimonials").select("*").order("display_order");
    setItems((data as Testimonial[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(item: Testimonial) {
    await supabase.from("testimonials").update({ is_active: !item.is_active }).eq("id", item.id);
    load();
  }

  async function handleDelete(item: Testimonial) {
    if (!confirm(`Remove testimonial from "${item.name}"?`)) return;
    await supabase.from("testimonials").delete().eq("id", item.id);
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-800">Testimonials</h1>
          <p className="mt-1 text-sm text-navy-800/60">
            Only add real reviews — never fabricate testimonials.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(undefined);
            setModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={16} className="mr-2" /> New Testimonial
        </button>
      </div>

      {loading ? (
        <p className="mt-10 text-navy-800/50">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-10 text-navy-800/50">No testimonials yet.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="card">
              <div className="flex gap-0.5 text-gold-500">
                {Array.from({ length: item.rating ?? 0 }).map((_, i) => (
                  <Star key={i} size={14} fill="currentColor" />
                ))}
              </div>
              <p className="mt-2 text-sm text-navy-800/80">"{item.review}"</p>
              <p className="mt-2 text-sm font-medium text-navy-800">— {item.name}</p>

              <div className="mt-4 flex items-center gap-3">
                <button
                  onClick={() => toggleActive(item)}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                    item.is_active ? "bg-green-100 text-green-700" : "bg-navy-100 text-navy-800/60"
                  }`}
                >
                  {item.is_active ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => {
                    setEditing(item);
                    setModalOpen(true);
                  }}
                  className="ml-auto rounded p-1.5 text-navy-800/60 hover:bg-navy-50"
                >
                  <Pencil size={16} />
                </button>
                <button onClick={() => handleDelete(item)} className="rounded p-1.5 text-red-600 hover:bg-red-50">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <TestimonialModal
          testimonial={editing}
          nextOrder={items.length}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function TestimonialModal({
  testimonial,
  nextOrder,
  onClose,
  onSaved,
}: {
  testimonial?: Testimonial;
  nextOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [name, setName] = useState(testimonial?.name ?? "");
  const [review, setReview] = useState(testimonial?.review ?? "");
  const [rating, setRating] = useState(testimonial?.rating?.toString() ?? "5");
  const [isActive, setIsActive] = useState(testimonial?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !review.trim()) {
      setError("Name and review are required.");
      return;
    }
    setSaving(true);
    const payload = { name: name.trim(), review: review.trim(), rating: Number(rating), is_active: isActive };
    const query = testimonial
      ? supabase.from("testimonials").update(payload).eq("id", testimonial.id)
      : supabase.from("testimonials").insert({ ...payload, display_order: nextOrder });
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
      <div className="w-full max-w-sm rounded-xl2 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-navy-800">
            {testimonial ? "Edit Testimonial" : "New Testimonial"}
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Name</span>
            <input required className="input mt-1" value={name} onChange={(e) => setName(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Review</span>
            <textarea required className="input mt-1 min-h-[80px]" value={review} onChange={(e) => setReview(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Rating (1–5)</span>
            <select className="input mt-1" value={rating} onChange={(e) => setRating(e.target.value)}>
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
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
