"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { X } from "lucide-react";

interface MemberRow {
  id: string;
  membership_id: string;
  status: string;
  start_date: string | null;
  expiry_date: string | null;
  plan_id: string | null;
  seat_id: string | null;
  profiles: { full_name: string; phone: string | null; email: string | null } | null;
  membership_plans: { name: string; duration_days: number } | null;
  seats: { seat_number: string } | null;
}

interface Seat {
  id: string;
  seat_number: string;
}

export default function AdminMembersPage() {
  const supabase = createClient();
  const [members, setMembers] = useState<MemberRow[]>([]);
  const [availableSeats, setAvailableSeats] = useState<Seat[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState<MemberRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: seats }] = await Promise.all([
      supabase
        .from("members")
        .select(
          "id, membership_id, status, start_date, expiry_date, plan_id, seat_id, profiles(full_name, phone, email), membership_plans(name, duration_days), seats(seat_number)"
        )
        .order("membership_id", { ascending: false }),
      supabase.from("seats").select("id, seat_number").eq("status", "available"),
    ]);
    setMembers((data as unknown as MemberRow[]) ?? []);
    setAvailableSeats((seats as Seat[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function deactivate(member: MemberRow) {
    if (!confirm(`Deactivate ${member.profiles?.full_name}'s membership?`)) return;
    await supabase.from("members").update({ status: "cancelled", is_active: false }).eq("id", member.id);
    if (member.seat_id) {
      await supabase.from("seats").update({ status: "available", member_id: null }).eq("id", member.seat_id);
    }
    load();
  }

  const filtered = members.filter((m) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      m.membership_id.toLowerCase().includes(q) ||
      m.profiles?.full_name?.toLowerCase().includes(q) ||
      m.profiles?.phone?.toLowerCase().includes(q) ||
      m.profiles?.email?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-800">Members</h1>
          <p className="mt-1 text-sm text-navy-800/60">
            New sign-ups appear here as "Pending" until activated.
          </p>
        </div>
        <input
          className="input w-64"
          placeholder="Search name, phone, email, ID…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="mt-10 text-navy-800/50">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="mt-10 text-navy-800/50">No members found.</p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl2 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-800/50">
              <tr>
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Expiry</th>
                <th className="px-5 py-3">Seat</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr key={m.id} className="border-b border-navy-50 last:border-0">
                  <td className="px-5 py-3">
                    <p className="font-medium text-navy-800">{m.profiles?.full_name ?? "—"}</p>
                    <p className="text-xs text-navy-800/50">{m.membership_id} · {m.profiles?.phone}</p>
                  </td>
                  <td className="px-5 py-3">{m.membership_plans?.name ?? "—"}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium capitalize ${
                        m.status === "active"
                          ? "bg-green-100 text-green-700"
                          : m.status === "pending"
                          ? "bg-gold-400/20 text-gold-600"
                          : "bg-navy-100 text-navy-800/60"
                      }`}
                    >
                      {m.status}
                    </span>
                  </td>
                  <td className="px-5 py-3">{m.expiry_date ?? "—"}</td>
                  <td className="px-5 py-3">{m.seats?.seat_number ?? "—"}</td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-3">
                      {m.status !== "active" && (
                        <button onClick={() => setActivating(m)} className="text-xs font-medium text-navy-600 hover:underline">
                          Activate
                        </button>
                      )}
                      {m.status === "active" && (
                        <button onClick={() => setActivating(m)} className="text-xs font-medium text-navy-600 hover:underline">
                          Renew
                        </button>
                      )}
                      {m.status !== "cancelled" && (
                        <button onClick={() => deactivate(m)} className="text-xs font-medium text-red-600 hover:underline">
                          Deactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activating && (
        <ActivateModal
          member={activating}
          availableSeats={availableSeats}
          onClose={() => setActivating(null)}
          onSaved={() => {
            setActivating(null);
            load();
          }}
        />
      )}
    </div>
  );
}

function ActivateModal({
  member,
  availableSeats,
  onClose,
  onSaved,
}: {
  member: MemberRow;
  availableSeats: Seat[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(member.start_date ?? today);
  const [seatId, setSeatId] = useState(member.seat_id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const durationDays = member.membership_plans?.duration_days ?? 30;
  const expiryDate = new Date(new Date(startDate).getTime() + durationDays * 86400000)
    .toISOString()
    .slice(0, 10);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const { error: updateError } = await supabase
      .from("members")
      .update({
        status: "active",
        is_active: true,
        start_date: startDate,
        expiry_date: expiryDate,
        seat_id: seatId || null,
      })
      .eq("id", member.id);

    if (updateError) {
      setError(updateError.message);
      setSaving(false);
      return;
    }

    if (seatId) {
      await supabase.from("seats").update({ status: "occupied", member_id: member.id }).eq("id", seatId);
    }
    // Free up their previous seat if they were reassigned.
    if (member.seat_id && member.seat_id !== seatId) {
      await supabase.from("seats").update({ status: "available", member_id: null }).eq("id", member.seat_id);
    }

    setSaving(false);
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-4">
      <div className="w-full max-w-sm rounded-xl2 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-navy-800">
            Activate {member.profiles?.full_name}
          </h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Start Date</span>
            <input type="date" className="input mt-1" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <p className="text-sm text-navy-800/60">
            Expiry (auto, {durationDays} days): <span className="font-medium text-navy-800">{expiryDate}</span>
          </p>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Assign Seat (optional)</span>
            <select className="input mt-1" value={seatId} onChange={(e) => setSeatId(e.target.value)}>
              <option value="">— No seat —</option>
              {member.seats && (
                <option value={member.seat_id ?? ""}>{member.seats.seat_number} (current)</option>
              )}
              {availableSeats.map((s) => (
                <option key={s.id} value={s.id}>{s.seat_number}</option>
              ))}
            </select>
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Saving…" : "Activate"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
