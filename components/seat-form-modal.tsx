"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Seat } from "@/types/database";
import { X } from "lucide-react";

export function SeatFormModal({
  seat,
  onClose,
  onSaved,
}: {
  seat?: Seat;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [seatNumber, setSeatNumber] = useState(seat?.seat_number ?? "");
  const [zone, setZone] = useState(seat?.zone ?? "");
  const [notes, setNotes] = useState(seat?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!seatNumber.trim()) {
      setError("Seat number is required.");
      return;
    }
    setSaving(true);
    setError(null);

    const payload = { seat_number: seatNumber.trim(), zone: zone.trim() || null, notes: notes.trim() || null };
    const query = seat
      ? supabase.from("seats").update(payload).eq("id", seat.id)
      : supabase.from("seats").insert({ ...payload, status: "available" });

    const { error: saveError } = await query;
    setSaving(false);

    if (saveError) {
      setError(saveError.message.includes("duplicate") ? "That seat number already exists." : saveError.message);
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-4">
      <div className="w-full max-w-sm rounded-xl2 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-navy-800">
            {seat ? "Edit Seat" : "New Seat"}
          </h2>
          <button onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Seat Number</span>
            <input
              required
              className="input mt-1"
              placeholder="e.g. A01"
              value={seatNumber}
              onChange={(e) => setSeatNumber(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Zone (optional)</span>
            <input
              className="input mt-1"
              placeholder="e.g. Zone A — Window Side"
              value={zone}
              onChange={(e) => setZone(e.target.value)}
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Notes (optional)</span>
            <input
              className="input mt-1"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Saving…" : "Save Seat"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
