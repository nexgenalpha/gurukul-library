"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SeatGrid, SeatLegend } from "@/components/seat-grid";
import { SeatFormModal } from "@/components/seat-form-modal";
import type { Seat, SeatStatus } from "@/types/database";
import { Plus } from "lucide-react";

interface BookingRequest {
  id: string;
  seat_id: string;
  member_id: string;
  status: string;
  requested_at: string;
  seats: { seat_number: string } | null;
  members: { membership_id: string; profiles: { full_name: string } | null } | null;
}

export default function AdminSeatsPage() {
  const supabase = createClient();
  const [seats, setSeats] = useState<Seat[]>([]);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSeat, setEditingSeat] = useState<Seat | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: seatData }, { data: reqData }] = await Promise.all([
      supabase.from("seats").select("*").order("seat_number"),
      supabase
        .from("seat_bookings")
        .select("id, seat_id, member_id, status, requested_at, seats(seat_number), members(membership_id, profiles(full_name))")
        .eq("status", "pending")
        .order("requested_at"),
    ]);
    setSeats((seatData as Seat[]) ?? []);
    setRequests((reqData as unknown as BookingRequest[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function changeStatus(seat: Seat, status: SeatStatus) {
    const update: Partial<Seat> = { status };
    if (status === "available" || status === "blocked") {
      update.member_id = null;
    }
    await supabase.from("seats").update(update).eq("id", seat.id);
    load();
  }

  async function handleDelete(seat: Seat) {
    if (!confirm(`Delete seat ${seat.seat_number}?`)) return;
    await supabase.from("seats").delete().eq("id", seat.id);
    load();
  }

  async function approveRequest(req: BookingRequest) {
    // Assign the seat to the member and mark the request approved. Any
    // other pending requests for the same seat are rejected automatically
    // since only one member can hold a seat.
    await Promise.all([
      supabase.from("seats").update({ status: "occupied", member_id: req.member_id }).eq("id", req.seat_id),
      supabase.from("members").update({ seat_id: req.seat_id }).eq("id", req.member_id),
      supabase.from("seat_bookings").update({ status: "approved" }).eq("id", req.id),
      supabase
        .from("seat_bookings")
        .update({ status: "rejected" })
        .eq("seat_id", req.seat_id)
        .neq("id", req.id)
        .eq("status", "pending"),
    ]);
    load();
  }

  async function rejectRequest(req: BookingRequest) {
    await supabase.from("seat_bookings").update({ status: "rejected" }).eq("id", req.id);
    load();
  }

  const counts = seats.reduce(
    (acc, s) => ({ ...acc, [s.status]: (acc[s.status] ?? 0) + 1 }),
    {} as Record<string, number>
  );

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-800">Seats</h1>
          <p className="mt-1 text-sm text-navy-800/60">
            {seats.length} seats — {counts.available ?? 0} available, {counts.occupied ?? 0} occupied,{" "}
            {counts.reserved ?? 0} reserved, {counts.blocked ?? 0} blocked
          </p>
        </div>
        <button
          onClick={() => {
            setEditingSeat(undefined);
            setModalOpen(true);
          }}
          className="btn-primary"
        >
          <Plus size={16} className="mr-2" /> New Seat
        </button>
      </div>

      {requests.length > 0 && (
        <div className="mt-6 rounded-xl2 bg-white p-5 shadow-card">
          <p className="font-medium text-navy-800">Pending Seat Requests ({requests.length})</p>
          <div className="mt-3 divide-y divide-navy-50">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center justify-between py-3 text-sm">
                <div>
                  <span className="font-medium text-navy-800">{r.seats?.seat_number}</span>
                  {" — "}
                  <span className="text-navy-800/70">
                    {r.members?.profiles?.full_name ?? "Unknown"} ({r.members?.membership_id})
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => approveRequest(r)}
                    className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => rejectRequest(r)}
                    className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <p className="mt-10 text-navy-800/50">Loading seats…</p>
      ) : seats.length === 0 ? (
        <p className="mt-10 text-navy-800/50">No seats yet. Add your first one.</p>
      ) : (
        <div className="mt-8">
          <SeatLegend />
          <div className="mt-6 rounded-xl2 bg-white p-6 shadow-card">
            <SeatGrid seats={seats} />
          </div>

          <div className="mt-8 overflow-hidden rounded-xl2 bg-white shadow-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-800/50">
                <tr>
                  <th className="px-5 py-3">Seat</th>
                  <th className="px-5 py-3">Zone</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {seats.map((seat) => (
                  <tr key={seat.id} className="border-b border-navy-50 last:border-0">
                    <td className="px-5 py-3 font-medium text-navy-800">{seat.seat_number}</td>
                    <td className="px-5 py-3 text-navy-800/70">{seat.zone ?? "—"}</td>
                    <td className="px-5 py-3">
                      <select
                        value={seat.status}
                        onChange={(e) => changeStatus(seat, e.target.value as SeatStatus)}
                        className="rounded-lg border border-navy-100 px-2 py-1 text-sm"
                      >
                        <option value="available">Available</option>
                        <option value="reserved">Reserved</option>
                        <option value="occupied">Occupied</option>
                        <option value="blocked">Blocked</option>
                      </select>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingSeat(seat);
                            setModalOpen(true);
                          }}
                          className="text-xs font-medium text-navy-600 hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(seat)}
                          className="text-xs font-medium text-red-600 hover:underline"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {modalOpen && (
        <SeatFormModal
          seat={editingSeat}
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
