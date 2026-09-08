import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { MembershipPlan, Facility } from "@/types/database";

export default async function HomePage() {
  const supabase = await createClient();

  const [{ data: content }, { data: heroMedia }, { data: facilities }, { data: plans }] = await Promise.all([
    supabase.from("website_content").select("content").eq("section_key", "home_hero").single(),
    // The hero image itself comes from the Media Manager (category='hero'),
    // not a hardcoded CMS field — replacing it there updates this page
    // with no code change, per the "admin-first content architecture".
    supabase
      .from("media")
      .select("public_url")
      .eq("category", "hero")
      .eq("is_active", true)
      .order("display_order")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("facilities")
      .select("*")
      .eq("is_active", true)
      .order("display_order")
      .limit(8),
    supabase
      .from("membership_plans")
      .select("*")
      .eq("is_active", true)
      .order("display_order")
      .limit(4),
  ]);

  const hero = ((content as { content?: object } | null)?.content as {
    headline?: string;
    subtext?: string;
  }) ?? {};
  const heroImageUrl =
    (heroMedia as { public_url?: string } | null)?.public_url ?? "/placeholder-hero.jpg";

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div
          className="absolute inset-0 -z-10 bg-cover bg-center"
          style={{
            backgroundImage: `url(${heroImageUrl})`,
          }}
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-navy-900/70 via-navy-900/50 to-cream" />

        <div className="section flex min-h-[70vh] flex-col justify-center text-white">
          <h1 className="max-w-2xl font-serif text-4xl font-semibold leading-tight sm:text-5xl">
            {hero.headline ?? "Your Space to Learn, Focus & Grow"}
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/85">
            {hero.subtext ??
              "A peaceful, comfortable and focused study environment for students and serious learners in Koyla Nagar, Kanpur."}
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/register" className="btn-primary">
              Join Now
            </Link>
            <Link
              href="/facilities"
              className="inline-flex items-center justify-center rounded-full border border-white/40 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
            >
              Explore Library
            </Link>
          </div>
        </div>
      </section>

      {/* TRUST / FACILITIES HIGHLIGHTS */}
      <section className="section">
        <h2 className="font-serif text-2xl font-semibold text-navy-800 sm:text-3xl">
          Why students choose Gurukul Library
        </h2>
        {facilities && facilities.length > 0 ? (
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {facilities.map((f: Facility) => (
              <div key={f.id} className="card text-center">
                <p className="font-medium text-navy-800">{f.name}</p>
                {f.description && (
                  <p className="mt-1 text-sm text-navy-800/60">{f.description}</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-navy-800/60">
            Facilities will appear here once configured in the Admin Panel.
          </p>
        )}
      </section>

      {/* MEMBERSHIP PREVIEW */}
      <section className="section bg-navy-50/50">
        <div className="flex items-end justify-between">
          <h2 className="font-serif text-2xl font-semibold text-navy-800 sm:text-3xl">
            Membership Plans
          </h2>
          <Link href="/membership" className="text-sm font-medium text-navy-600 hover:underline">
            View all plans →
          </Link>
        </div>

        {plans && plans.length > 0 ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {plans.map((p: MembershipPlan) => (
              <div key={p.id} className="card relative flex flex-col">
                {p.badge && (
                  <span className="absolute -top-3 right-6 rounded-full bg-gold-500 px-3 py-1 text-xs font-semibold text-white">
                    {p.badge}
                  </span>
                )}
                <p className="text-sm font-medium uppercase tracking-wide text-navy-800/60">
                  {p.name}
                </p>
                <p className="mt-2 font-serif text-3xl font-semibold text-navy-800">
                  ₹{p.price}
                </p>
                <p className="text-sm text-navy-800/60">{p.duration_days} days</p>
                <Link href={`/register?plan=${p.id}`} className="btn-primary mt-6 w-full">
                  Choose Plan
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-6 text-navy-800/60">
            Membership plans will appear here once added in the Admin Panel.
          </p>
        )}
      </section>
    </>
  );
}
