import type { Seat, SeatStatus } from "@/types/database";

const STATUS_STYLES: Record<SeatStatus, string> = {
  available: "bg-white border-navy-200 text-navy-800 hover:border-navy-400",
  reserved: "bg-gold-400/20 border-gold-500 text-gold-600",
  occupied: "bg-navy-600 border-navy-600 text-white",
  blocked: "bg-navy-100 border-navy-100 text-navy-800/30 cursor-not-allowed",
};

export function SeatGrid({
  seats,
  selectedSeatId,
  onSelectSeat,
}: {
  seats: Seat[];
  selectedSeatId?: string | null;
  onSelectSeat?: (seat: Seat) => void;
}) {
  // Group by zone so a real floor plan (Zone A, Zone B, ...) reads clearly
  // instead of one flat wall of seats.
  const zones = seats.reduce<Record<string, Seat[]>>((acc, seat) => {
    const zone = seat.zone || "General";
    (acc[zone] ??= []).push(seat);
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {Object.entries(zones).map(([zone, zoneSeats]) => (
        <div key={zone}>
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-navy-800/50">
            {zone}
          </p>
          <div className="grid grid-cols-6 gap-3 sm:grid-cols-8 md:grid-cols-10">
            {zoneSeats.map((seat) => {
              const clickable = onSelectSeat && seat.status === "available";
              const selected = selectedSeatId === seat.id;
              return (
                <button
                  key={seat.id}
                  type="button"
                  disabled={!clickable}
                  onClick={() => clickable && onSelectSeat?.(seat)}
                  className={`flex aspect-square items-center justify-center rounded-lg border text-xs font-medium transition-all ${
                    STATUS_STYLES[seat.status]
                  } ${selected ? "ring-2 ring-navy-600 ring-offset-2" : ""} ${
                    clickable ? "cursor-pointer" : ""
                  }`}
                  title={`${seat.seat_number} — ${seat.status}`}
                >
                  {seat.seat_number}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SeatLegend() {
  const items: { label: string; className: string }[] = [
    { label: "Available", className: "bg-white border-navy-200" },
    { label: "Reserved", className: "bg-gold-400/20 border-gold-500" },
    { label: "Occupied", className: "bg-navy-600 border-navy-600" },
    { label: "Blocked", className: "bg-navy-100 border-navy-100" },
  ];
  return (
    <div className="flex flex-wrap gap-4 text-sm text-navy-800/70">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <span className={`h-4 w-4 rounded border ${item.className}`} />
          {item.label}
        </div>
      ))}
    </div>
  );
}
