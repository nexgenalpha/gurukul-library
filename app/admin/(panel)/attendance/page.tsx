"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface AttendanceRow {
  id: string;
  member_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  members: { membership_id: string; profiles: { full_name: string } | null } | null;
}

interface ActiveMember {
  id: string;
  membership_id: string;
  profiles: { full_name: string } | null;
}

export default function AdminAttendancePage() {
  const supabase = createClient();
  const today = new Date().toISOString().slice(0, 10);
  const [rows, setRows] = useState<AttendanceRow[]>([]);
  const [activeMembers, setActiveMembers] = useState<ActiveMember[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: members }] = await Promise.all([
      supabase
        .from("attendance")
        .select("id, member_id, date, check_in, check_out, status, members(membership_id, profiles(full_name))")
        .eq("date", today)
        .order("check_in", { ascending: false }),
      supabase
        .from("members")
        .select("id, membership_id, profiles(full_name)")
        .eq("status", "active"),
    ]);
    setRows((data as unknown as AttendanceRow[]) ?? []);
    setActiveMembers((members as unknown as ActiveMember[]) ?? []);
    setLoading(false);
  }, [supabase, today]);

  useEffect(() => {
    load();
  }, [load]);

  async function checkIn() {
    if (!selectedMember) return;
    await supabase.from("attendance").insert({
      member_id: selectedMember,
      date: today,
      check_in: new Date().toISOString(),
      status: "checked_in",
    });
    setSelectedMember("");
    load();
  }

  async function checkOut(row: AttendanceRow) {
    await supabase
      .from("attendance")
      .update({ check_out: new Date().toISOString(), status: "checked_out" })
      .eq("id", row.id);
    load();
  }

  const checkedInIds = new Set(rows.filter((r) => r.status === "checked_in").map((r) => r.member_id));
  const eligibleMembers = activeMembers.filter((m) => !checkedInIds.has(m.id));

  return (
    <div className="p-8">
      <h1 className="font-serif text-2xl font-semibold text-navy-800">Attendance</h1>
      <p className="mt-1 text-sm text-navy-800/60">Today, {today}</p>

      <div className="mt-6 flex items-center gap-3">
        <select className="input w-64" value={selectedMember} onChange={(e) => setSelectedMember(e.target.value)}>
          <option value="">Select member to check in…</option>
          {eligibleMembers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.profiles?.full_name} ({m.membership_id})
            </option>
          ))}
        </select>
        <button onClick={checkIn} disabled={!selectedMember} className="btn-primary">
          Check In
        </button>
      </div>

      {loading ? (
        <p className="mt-10 text-navy-800/50">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="mt-10 text-navy-800/50">No attendance recorded yet today.</p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl2 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-800/50">
              <tr>
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Check In</th>
                <th className="px-5 py-3">Check Out</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-navy-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-navy-800">
                    {r.members?.profiles?.full_name} ({r.members?.membership_id})
                  </td>
                  <td className="px-5 py-3">{r.check_in ? new Date(r.check_in).toLocaleTimeString() : "—"}</td>
                  <td className="px-5 py-3">{r.check_out ? new Date(r.check_out).toLocaleTimeString() : "—"}</td>
                  <td className="px-5 py-3 capitalize">{r.status.replace("_", " ")}</td>
                  <td className="px-5 py-3 text-right">
                    {r.status === "checked_in" && (
                      <button onClick={() => checkOut(r)} className="text-xs font-medium text-navy-600 hover:underline">
                        Check Out
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
