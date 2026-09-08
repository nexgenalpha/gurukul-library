import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { MembershipPlan } from "@/types/database";
import { Check } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Membership Plans",
  description: "Flexible membership plans for Gurukul Library, Koyla Nagar, Kanpur.",
};

export default async function MembershipPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("membership_plans")
    .select("*")
    .eq("is_active", true)
    .order("display_order");

  const plans = (data as MembershipPlan[]) ?? [];

  return (
    <div className="section">
      <div className="text-center">
        <h1 className="font-serif text-3xl font-semibold text-navy-800 sm:text-4xl">
          Membership Plans
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-navy-800/60">
          Choose the plan that fits your study schedule. Every plan includes access to a
          comfortable, focused reading environment.
        </p>
      </div>

      {plans.length === 0 ? (
        <p className="mt-16 text-center text-navy-800/50">
          Membership plans will appear here once added in the Admin Panel.
        </p>
      ) : (
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <div key={plan.id} className="card relative flex flex-col">
              {plan.badge && (
                <span className="absolute -top-3 right-6 rounded-full bg-gold-500 px-3 py-1 text-xs font-semibold text-white">
                  {plan.badge}
                </span>
              )}
              <p className="text-sm font-medium uppercase tracking-wide text-navy-800/60">
                {plan.name}
              </p>
              <p className="mt-2 font-serif text-3xl font-semibold text-navy-800">
                ₹{plan.price}
              </p>
              <p className="text-sm text-navy-800/60">{plan.duration_days} days</p>

              {plan.features?.length > 0 && (
                <ul className="mt-5 flex-1 space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-navy-800/80">
                      <Check size={16} className="mt-0.5 shrink-0 text-navy-600" />
                      {f}
                    </li>
                  ))}
                </ul>
              )}

              <Link href={`/register?plan=${plan.id}`} className="btn-primary mt-6 w-full">
                Choose Plan
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
