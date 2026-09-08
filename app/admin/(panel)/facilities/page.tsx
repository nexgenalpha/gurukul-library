"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Facility } from "@/types/database";
import { Plus, Pencil, Trash2, X, ArrowUp, ArrowDown } from "lucide-react";

type FormState = { name: string; description: string; icon: string; is_active: boolean };

export default function AdminFacilitiesPage() {
  const supabase = createClient();
  const [items, setItems] = useState<Facility[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Facility | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("facilities").select("*").order("display_order");
    setItems((data as Facility[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(item: Facility) {
    await supabase.from("facilities").update({ is_active: !item.is_active }).eq("id", item.id);
    load();
  }

  async function handleDelete(item: Facility) {
    if (!confirm(`Delete "${item.name}"?`)) return;
    await supabase.from("facilities").delete().eq("id", item.id);
    load();
  }

  async function move(item: Facility, direction: "up" | "down") {
    const index = items.findIndex((p) => p.id === item.id);
    const swapWith = direction === "up" ? items[index - 1] : items[index + 1];
    if (!swapWith) return;
    await Promise.all([
      supabase.from("facilities").update({ display_order: swapWith.display_order }).eq("id", item.id),
      supabase.from("facilities").update({ display_order: item.display_order }).eq("id", swapWith.id),
    ]);
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-800">Facilities</h1>
          <p className="mt-1 text-sm text-navy-800/60">Shown on the homepage and Facilities page.</p>
        </div>
        <button
          onClick={() => {
            setEditing(undefined);
            setModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={16} className="mr-2" /> New Facility
        </button>
      </div>

      {loading ? (
        <p className="mt-10 text-navy-800/50">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-10 text-navy-800/50">No facilities yet.</p>
      ) : (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div key={item.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  {item.icon && <p className="text-2xl">{item.icon}</p>}
                  <p className="mt-1 font-medium text-navy-800">{item.name}</p>
                  {item.description && (
                    <p className="mt-1 text-sm text-navy-800/60">{item.description}</p>
                  )}
                </div>
                <div className="flex flex-col gap-1">
                  <button disabled={i === 0} onClick={() => move(item, "up")} className="text-navy-800/40 hover:text-navy-800 disabled:opacity-20">
                    <ArrowUp size={14} />
                  </button>
                  <button disabled={i === items.length - 1} onClick={() => move(item, "down")} className="text-navy-800/40 hover:text-navy-800 disabled:opacity-20">
                    <ArrowDown size={14} />
                  </button>
                </div>
              </div>
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
        <FacilityModal
          facility={editing}
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

function FacilityModal({
  facility,
  nextOrder,
  onClose,
  onSaved,
}: {
  facility?: Facility;
  nextOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [form, setForm] = useState<FormState>({
    name: facility?.name ?? "",
    description: facility?.description ?? "",
    icon: facility?.icon ?? "",
    is_active: facility?.is_active ?? true,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Name is required.");
      return;
    }
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || null,
      icon: form.icon.trim() || null,
      is_active: form.is_active,
    };
    const query = facility
      ? supabase.from("facilities").update(payload).eq("id", facility.id)
      : supabase.from("facilities").insert({ ...payload, display_order: nextOrder });
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
            {facility ? "Edit Facility" : "New Facility"}
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Name</span>
            <input required className="input mt-1" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Icon (emoji, optional)</span>
            <input className="input mt-1" placeholder="📶" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Description (optional)</span>
            <input className="input mt-1" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </label>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
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
