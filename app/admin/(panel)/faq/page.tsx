"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, X, ArrowUp, ArrowDown } from "lucide-react";

interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  is_active: boolean;
  display_order: number;
}

export default function AdminFaqPage() {
  const supabase = createClient();
  const [items, setItems] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Faq | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("faqs").select("*").order("display_order");
    setItems((data as Faq[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function toggleActive(item: Faq) {
    await supabase.from("faqs").update({ is_active: !item.is_active }).eq("id", item.id);
    load();
  }

  async function handleDelete(item: Faq) {
    if (!confirm("Delete this FAQ?")) return;
    await supabase.from("faqs").delete().eq("id", item.id);
    load();
  }

  async function move(item: Faq, direction: "up" | "down") {
    const index = items.findIndex((p) => p.id === item.id);
    const swapWith = direction === "up" ? items[index - 1] : items[index + 1];
    if (!swapWith) return;
    await Promise.all([
      supabase.from("faqs").update({ display_order: swapWith.display_order }).eq("id", item.id),
      supabase.from("faqs").update({ display_order: item.display_order }).eq("id", swapWith.id),
    ]);
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-navy-800">FAQ</h1>
        <button
          onClick={() => {
            setEditing(undefined);
            setModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={16} className="mr-2" /> New FAQ
        </button>
      </div>

      {loading ? (
        <p className="mt-10 text-navy-800/50">Loading…</p>
      ) : items.length === 0 ? (
        <p className="mt-10 text-navy-800/50">No FAQs yet.</p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl2 bg-white shadow-card">
          {items.map((item, i) => (
            <div key={item.id} className="flex items-start gap-4 border-b border-navy-50 px-5 py-4 last:border-0">
              <div className="flex flex-col gap-1 pt-1">
                <button disabled={i === 0} onClick={() => move(item, "up")} className="text-navy-800/40 hover:text-navy-800 disabled:opacity-20">
                  <ArrowUp size={14} />
                </button>
                <button disabled={i === items.length - 1} onClick={() => move(item, "down")} className="text-navy-800/40 hover:text-navy-800 disabled:opacity-20">
                  <ArrowDown size={14} />
                </button>
              </div>
              <div className="flex-1">
                <p className="font-medium text-navy-800">{item.question}</p>
                <p className="mt-1 text-sm text-navy-800/60">{item.answer}</p>
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
        <FaqModal
          faq={editing}
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

function FaqModal({
  faq,
  nextOrder,
  onClose,
  onSaved,
}: {
  faq?: Faq;
  nextOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [question, setQuestion] = useState(faq?.question ?? "");
  const [answer, setAnswer] = useState(faq?.answer ?? "");
  const [category, setCategory] = useState(faq?.category ?? "");
  const [isActive, setIsActive] = useState(faq?.is_active ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim() || !answer.trim()) {
      setError("Question and answer are required.");
      return;
    }
    setSaving(true);
    const payload = {
      question: question.trim(),
      answer: answer.trim(),
      category: category.trim() || null,
      is_active: isActive,
    };
    const query = faq
      ? supabase.from("faqs").update(payload).eq("id", faq.id)
      : supabase.from("faqs").insert({ ...payload, display_order: nextOrder });
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
          <h2 className="font-serif text-lg font-semibold text-navy-800">{faq ? "Edit FAQ" : "New FAQ"}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Question</span>
            <input required className="input mt-1" value={question} onChange={(e) => setQuestion(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Answer</span>
            <textarea required className="input mt-1 min-h-[100px]" value={answer} onChange={(e) => setAnswer(e.target.value)} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Category (optional)</span>
            <input className="input mt-1" value={category} onChange={(e) => setCategory(e.target.value)} />
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
