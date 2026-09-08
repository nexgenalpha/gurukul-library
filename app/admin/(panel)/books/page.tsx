"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";

interface Book {
  id: string;
  title: string;
  author: string | null;
  category: string | null;
  isbn: string | null;
  language: string | null;
  total_copies: number;
  available_copies: number;
  shelf_location: string | null;
}

export default function AdminBooksPage() {
  const supabase = createClient();
  const [items, setItems] = useState<Book[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Book | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("books").select("*").order("title");
    setItems((data as Book[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleDelete(item: Book) {
    if (!confirm(`Delete "${item.title}"?`)) return;
    await supabase.from("books").delete().eq("id", item.id);
    load();
  }

  const filtered = items.filter((b) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      b.title.toLowerCase().includes(q) ||
      b.author?.toLowerCase().includes(q) ||
      b.category?.toLowerCase().includes(q) ||
      b.isbn?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-serif text-2xl font-semibold text-navy-800">Books</h1>
        <button onClick={() => { setEditing(undefined); setModalOpen(true); }} className="btn-primary">
          <Plus size={16} className="mr-2" /> New Book
        </button>
      </div>

      <div className="relative mt-6 max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy-800/40" />
        <input className="input pl-9" placeholder="Search title, author, category, ISBN…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <p className="mt-10 text-navy-800/50">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-navy-800/50">No books found.</p>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl2 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-800/50">
              <tr>
                <th className="px-5 py-3">Title</th>
                <th className="px-5 py-3">Author</th>
                <th className="px-5 py-3">Category</th>
                <th className="px-5 py-3">Available</th>
                <th className="px-5 py-3">Shelf</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((b) => (
                <tr key={b.id} className="border-b border-navy-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-navy-800">{b.title}</td>
                  <td className="px-5 py-3">{b.author ?? "—"}</td>
                  <td className="px-5 py-3">{b.category ?? "—"}</td>
                  <td className="px-5 py-3">{b.available_copies} / {b.total_copies}</td>
                  <td className="px-5 py-3">{b.shelf_location ?? "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setEditing(b); setModalOpen(true); }} className="rounded p-1.5 text-navy-800/60 hover:bg-navy-50">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(b)} className="rounded p-1.5 text-red-600 hover:bg-red-50">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <BookModal book={editing} onClose={() => setModalOpen(false)} onSaved={() => { setModalOpen(false); load(); }} />
      )}
    </div>
  );
}

function BookModal({ book, onClose, onSaved }: { book?: Book; onClose: () => void; onSaved: () => void }) {
  const supabase = createClient();
  const [form, setForm] = useState({
    title: book?.title ?? "",
    author: book?.author ?? "",
    category: book?.category ?? "",
    isbn: book?.isbn ?? "",
    language: book?.language ?? "",
    total_copies: book?.total_copies?.toString() ?? "1",
    shelf_location: book?.shelf_location ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }
    setSaving(true);
    const total = Number(form.total_copies) || 1;
    const payload = {
      title: form.title.trim(),
      author: form.author.trim() || null,
      category: form.category.trim() || null,
      isbn: form.isbn.trim() || null,
      language: form.language.trim() || null,
      total_copies: total,
      shelf_location: form.shelf_location.trim() || null,
    };
    const query = book
      ? supabase.from("books").update(payload).eq("id", book.id)
      : supabase.from("books").insert({ ...payload, available_copies: total });
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
          <h2 className="font-serif text-lg font-semibold text-navy-800">{book ? "Edit Book" : "New Book"}</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Title</span>
            <input required className="input mt-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-navy-800">Author</span>
              <input className="input mt-1" value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-navy-800">Category</span>
              <input className="input mt-1" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-navy-800">ISBN</span>
              <input className="input mt-1" value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-navy-800">Language</span>
              <input className="input mt-1" value={form.language} onChange={(e) => setForm({ ...form, language: e.target.value })} />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-navy-800">Total Copies</span>
              <input type="number" min="1" className="input mt-1" value={form.total_copies} onChange={(e) => setForm({ ...form, total_copies: e.target.value })} />
              {book && (
                <p className="mt-1 text-xs text-navy-800/50">
                  Currently {book.available_copies} available — adjust total carefully if copies are issued.
                </p>
              )}
            </label>
            <label className="block">
              <span className="text-sm font-medium text-navy-800">Shelf Location</span>
              <input className="input mt-1" value={form.shelf_location} onChange={(e) => setForm({ ...form, shelf_location: e.target.value })} />
            </label>
          </div>
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
