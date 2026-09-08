"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { SeatGrid, SeatLegend } from "@/components/seat-grid";
import type { Seat } from "@/types/database";

export function SeatBookingClient({
  seats,
  isLoggedIn,
  memberId,
}: {
  seats: Seat[];
  isLoggedIn: boolean;
  memberId: string | null;
}) {
  const supabase = createClient();
  const [selected, setSelected] = useState<Seat | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRequest() {
    if (!selected || !memberId) return;
    setSubmitting(true);
    setError(null);

    const { error: bookingError } = await supabase.from("seat_bookings").insert({
      seat_id: selected.id,
      member_id: memberId,
      status: "pending",
    });

    setSubmitting(false);
    if (bookingError) {
      setError(bookingError.message);
      return;
    }
    setSubmitted(true);
  }

  return (
    <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
      <div>
        <SeatLegend />
        <div className="mt-6">
          <SeatGrid
            seats={seats}
            selectedSeatId={selected?.id}
            onSelectSeat={(seat) => {
              setSelected(seat);
              setSubmitted(false);
              setError(null);
            }}
          />
        </div>
      </div>

      <div className="h-fit rounded-xl2 bg-white p-6 shadow-card">
        {!selected ? (
          <p className="text-sm text-navy-800/60">
            Select an available seat to request it.
          </p>
        ) : submitted ? (
          <div>
            <p className="font-medium text-navy-800">Request sent!</p>
            <p className="mt-2 text-sm text-navy-800/60">
              Seat {selected.seat_number} has been requested. A librarian will confirm it shortly
              — check your dashboard for updates.
            </p>
          </div>
        ) : (
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-navy-800/50">
              Selected Seat
            </p>
            <p className="mt-1 font-serif text-2xl font-semibold text-navy-800">
              {selected.seat_number}
            </p>
            {selected.zone && <p className="text-sm text-navy-800/60">{selected.zone}</p>}

            {!isLoggedIn ? (
              <div className="mt-6">
                <p className="text-sm text-navy-800/60">Log in to request this seat.</p>
                <Link href="/login" className="btn-primary mt-3 w-full">
                  Log In
                </Link>
              </div>
            ) : !memberId ? (
              <div className="mt-6">
                <p className="text-sm text-navy-800/60">
                  Choose a membership plan before requesting a seat.
                </p>
                <Link href="/membership" className="btn-primary mt-3 w-full">
                  View Plans
                </Link>
              </div>
            ) : (
              <>
                {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
                <button
                  onClick={handleRequest}
                  disabled={submitting}
                  className="btn-primary mt-6 w-full"
                >
                  {submitting ? "Requesting…" : "Request This Seat"}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
