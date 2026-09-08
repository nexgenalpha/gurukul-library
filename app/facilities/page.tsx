import { createClient } from "@/lib/supabase/server";
import type { Facility } from "@/types/database";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Facilities",
  description: "Facilities available at Gurukul Library, Koyla Nagar, Kanpur.",
};

export default async function FacilitiesPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("facilities")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  const facilities = (data as Facility[]) ?? [];

  return (
    <div className="section">
      <h1 className="font-serif text-3xl font-semibold text-navy-800 sm:text-4xl">Facilities</h1>
      <p className="mt-3 max-w-xl text-navy-800/60">
        Everything at Gurukul Library is designed around one goal: helping you focus.
      </p>

      {facilities.length === 0 ? (
        <p className="mt-16 text-navy-800/50">
          Facilities will appear here once added in the Admin Panel.
        </p>
      ) : (
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {facilities.map((f) => (
            <div key={f.id} className="card text-center">
              {f.icon && <p className="text-3xl">{f.icon}</p>}
              <p className="mt-2 font-medium text-navy-800">{f.name}</p>
              {f.description && <p className="mt-1 text-sm text-navy-800/60">{f.description}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
