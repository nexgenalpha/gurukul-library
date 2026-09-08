import { createClient } from "@/lib/supabase/server";
import type { Seat } from "@/types/database";
import { SeatBookingClient } from "@/components/seat-booking-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Seat Availability",
  description: "Check real-time seat availability at Gurukul Library, Koyla Nagar, Kanpur.",
};

export default async function SeatsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: seatsData } = await supabase
    .from("seats")
    .select("*")
    .order("seat_number");
  const seats = (seatsData as Seat[]) ?? [];

  let memberId: string | null = null;
  if (user) {
    const { data: member } = await supabase
      .from("members")
      .select("id")
      .eq("profile_id", user.id)
      .maybeSingle();
    memberId = (member as { id: string } | null)?.id ?? null;
  }

  return (
    <div className="section">
      <h1 className="font-serif text-3xl font-semibold text-navy-800 sm:text-4xl">
        Seat Availability
      </h1>
      <p className="mt-3 max-w-xl text-navy-800/60">
        Pick an available seat below and request it — a librarian confirms every request before
        it's assigned.
      </p>

      {seats.length === 0 ? (
        <p className="mt-16 text-navy-800/50">
          Seats will appear here once configured in the Admin Panel.
        </p>
      ) : (
        <SeatBookingClient seats={seats} isLoggedIn={!!user} memberId={memberId} />
      )}
    </div>
  );
}
