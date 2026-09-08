"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface IssueRow {
  id: string;
  issue_date: string;
  due_date: string;
  return_date: string | null;
  status: string;
  books: { title: string } | null;
  members: { membership_id: string; profiles: { full_name: string } | null } | null;
}

interface BookOption {
  id: string;
  title: string;
  available_copies: number;
}

interface MemberOption {
  id: string;
  membership_id: string;
  profiles: { full_name: string } | null;
}

export default function AdminBookIssuesPage() {
  const supabase = createClient();
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [books, setBooks] = useState<BookOption[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ bookId: "", memberId: "", dueDate: "" });
  const [issuing, setIssuing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: bookData }, { data: memberData }] = await Promise.all([
      supabase
        .from("book_issues")
        .select("id, issue_date, due_date, return_date, status, books(title), members(membership_id, profiles(full_name))")
        .order("issue_date", { ascending: false }),
      supabase.from("books").select("id, title, available_copies").gt("available_copies", 0),
      supabase.from("members").select("id, membership_id, profiles(full_name)").eq("status", "active"),
    ]);
    setIssues((data as unknown as IssueRow[]) ?? []);
    setBooks((bookData as BookOption[]) ?? []);
    setMembers((memberData as unknown as MemberOption[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    const twoWeeks = new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10);
    setForm((f) => ({ ...f, dueDate: twoWeeks }));
    load();
  }, [load]);

  async function handleIssue() {
    if (!form.bookId || !form.memberId || !form.dueDate) return;
    setIssuing(true);
    setError(null);

    const book = books.find((b) => b.id === form.bookId);
    const { error: issueError } = await supabase.from("book_issues").insert({
      book_id: form.bookId,
      member_id: form.memberId,
      due_date: form.dueDate,
      status: "issued",
    });

    if (issueError) {
      setError(issueError.message);
      setIssuing(false);
      return;
    }

    await supabase
      .from("books")
      .update({ available_copies: (book?.available_copies ?? 1) - 1 })
      .eq("id", form.bookId);

    setForm({ ...form, bookId: "", memberId: "" });
    setIssuing(false);
    load();
  }

  async function markReturned(issue: IssueRow) {
    await supabase
      .from("book_issues")
      .update({ status: "returned", return_date: new Date().toISOString().slice(0, 10) })
      .eq("id", issue.id);

    // Increment available_copies back up for that book.
    const { data: bookRow } = await supabase
      .from("books")
      .select("id, available_copies")
      .eq("title", issue.books?.title)
      .single();
    if (bookRow) {
      await supabase
        .from("books")
        .update({ available_copies: (bookRow as { available_copies: number }).available_copies + 1 })
        .eq("id", (bookRow as { id: string }).id);
    }
    load();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-8">
      <h1 className="font-serif text-2xl font-semibold text-navy-800">Book Issues</h1>

      <div className="mt-6 card">
        <p className="font-medium text-navy-800">Issue a Book</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-4">
          <select className="input" value={form.bookId} onChange={(e) => setForm({ ...form, bookId: e.target.value })}>
            <option value="">Select book…</option>
            {books.map((b) => (
              <option key={b.id} value={b.id}>{b.title} ({b.available_copies} avail.)</option>
            ))}
          </select>
          <select className="input" value={form.memberId} onChange={(e) => setForm({ ...form, memberId: e.target.value })}>
            <option value="">Select member…</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.profiles?.full_name} ({m.membership_id})</option>
            ))}
          </select>
          <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
          <button onClick={handleIssue} disabled={issuing || !form.bookId || !form.memberId} className="btn-primary">
            {issuing ? "Issuing…" : "Issue Book"}
          </button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {loading ? (
        <p className="mt-10 text-navy-800/50">Loading…</p>
      ) : issues.length === 0 ? (
        <p className="mt-10 text-navy-800/50">No books issued yet.</p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl2 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-800/50">
              <tr>
                <th className="px-5 py-3">Book</th>
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Issue Date</th>
                <th className="px-5 py-3">Due Date</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((i) => {
                const overdue = i.status === "issued" && i.due_date < today;
                return (
                  <tr key={i.id} className="border-b border-navy-50 last:border-0">
                    <td className="px-5 py-3 font-medium text-navy-800">{i.books?.title}</td>
                    <td className="px-5 py-3">{i.members?.profiles?.full_name}</td>
                    <td className="px-5 py-3">{i.issue_date}</td>
                    <td className="px-5 py-3">{i.due_date}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                          i.status === "returned"
                            ? "bg-green-100 text-green-700"
                            : overdue
                            ? "bg-red-100 text-red-700"
                            : "bg-gold-400/20 text-gold-600"
                        }`}
                      >
                        {i.status === "issued" && overdue ? "Overdue" : i.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      {i.status === "issued" && (
                        <button onClick={() => markReturned(i)} className="text-xs font-medium text-navy-600 hover:underline">
                          Mark Returned
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
