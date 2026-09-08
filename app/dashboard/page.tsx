import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Member } from "@/types/database";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profileData } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();
  const profile = profileData as { full_name: string } | null;

  const { data: memberData } = await supabase
    .from("members")
    .select("*, membership_plans(name), seats(seat_number)")
    .eq("profile_id", user.id)
    .single();
  const member = memberData as
    | (Member & { membership_plans: { name: string } | null; seats: { seat_number: string } | null })
    | null;

  return (
    <div className="section">
      <h1 className="font-serif text-3xl font-semibold text-navy-800">
        Welcome, {profile?.full_name ?? "Student"}
      </h1>

      {!member ? (
        <div className="card mt-8">
          <p className="text-navy-800/70">
            You don't have an active membership yet. Choose a plan to get started.
          </p>
          <a href="/membership" className="btn-primary mt-4 inline-flex">
            View Membership Plans
          </a>
        </div>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="card">
            <p className="text-sm text-navy-800/60">Membership ID</p>
            <p className="mt-1 text-lg font-medium text-navy-800">{member.membership_id}</p>
          </div>
          <div className="card">
            <p className="text-sm text-navy-800/60">Plan</p>
            <p className="mt-1 text-lg font-medium text-navy-800">
              {member.membership_plans?.name ?? "—"}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-navy-800/60">Status</p>
            <p className="mt-1 text-lg font-medium capitalize text-navy-800">{member.status}</p>
          </div>
          <div className="card">
            <p className="text-sm text-navy-800/60">Expiry Date</p>
            <p className="mt-1 text-lg font-medium text-navy-800">
              {member.expiry_date ?? "—"}
            </p>
          </div>
          <div className="card">
            <p className="text-sm text-navy-800/60">Assigned Seat</p>
            <p className="mt-1 text-lg font-medium text-navy-800">
              {member.seats?.seat_number ?? "Not assigned"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
