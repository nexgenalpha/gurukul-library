import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/stat-card";

export default async function AdminDashboardPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  // Every count below is a real query against the tables from
  // supabase/schema.sql — nothing on this page is placeholder data.
  const [
    totalMembers,
    activeMembers,
    expiredMembers,
    todaysAttendance,
    availableSeats,
    occupiedSeats,
    totalBooks,
    booksIssued,
    pendingPayments,
    monthlyRevenue,
  ] = await Promise.all([
    supabase.from("members").select("id", { count: "exact", head: true }),
    supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("members").select("id", { count: "exact", head: true }).eq("status", "expired"),
    supabase.from("attendance").select("id", { count: "exact", head: true }).eq("date", today),
    supabase.from("seats").select("id", { count: "exact", head: true }).eq("status", "available"),
    supabase.from("seats").select("id", { count: "exact", head: true }).eq("status", "occupied"),
    supabase.from("books").select("id", { count: "exact", head: true }),
    supabase.from("book_issues").select("id", { count: "exact", head: true }).eq("status", "issued"),
    supabase.from("payments").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase
      .from("payments")
      .select("amount")
      .eq("status", "paid")
      .gte("payment_date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
  ]);

  const revenue = ((monthlyRevenue.data ?? []) as { amount: number }[]).reduce(
    (sum, p) => sum + Number(p.amount),
    0
  );

  const stats = [
    { label: "Total Members", value: totalMembers.count ?? 0 },
    { label: "Active Members", value: activeMembers.count ?? 0 },
    { label: "Expired Members", value: expiredMembers.count ?? 0 },
    { label: "Today's Attendance", value: todaysAttendance.count ?? 0 },
    { label: "Available Seats", value: availableSeats.count ?? 0 },
    { label: "Occupied Seats", value: occupiedSeats.count ?? 0 },
    { label: "Total Books", value: totalBooks.count ?? 0 },
    { label: "Books Issued", value: booksIssued.count ?? 0 },
    { label: "Pending Payments", value: pendingPayments.count ?? 0 },
    { label: "Monthly Revenue", value: `₹${revenue.toLocaleString("en-IN")}` },
  ];

  return (
    <div className="p-8">
      <h1 className="font-serif text-2xl font-semibold text-navy-800">Dashboard</h1>
      <p className="mt-1 text-sm text-navy-800/60">Overview of Gurukul Library right now.</p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => (
          <StatCard key={s.label} label={s.label} value={s.value} />
        ))}
      </div>
    </div>
  );
}
