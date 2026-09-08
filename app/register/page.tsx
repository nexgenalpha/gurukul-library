"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { MembershipPlan } from "@/types/database";

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planId = searchParams.get("plan");
  const supabase = createClient();

  const [form, setForm] = useState({ fullName: "", phone: "", email: "", password: "" });
  const [plan, setPlan] = useState<MembershipPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!planId) return;
    supabase
      .from("membership_plans")
      .select("*")
      .eq("id", planId)
      .single()
      .then(({ data }) => setPlan((data as MembershipPlan) ?? null));
  }, [planId, supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Supabase Auth handles password hashing/storage — the app never
    // touches or stores a plain-text password itself.
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: { full_name: form.fullName, phone: form.phone },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // The `handle_new_user` DB trigger creates the profiles row automatically.
    // If a plan was selected on the Membership page, create the member
    // record now, status 'pending' — admin activates it (sets start/expiry
    // dates and a seat) once payment is confirmed. This intentionally
    // doesn't auto-activate membership from a client-side form.
    if (data.user) {
      if (planId) {
        await supabase.from("members").insert({
          profile_id: data.user.id,
          plan_id: planId,
          status: "pending",
        });
      }
      router.push("/dashboard");
    }
    setLoading(false);
  }

  return (
    <div className="section max-w-md">
      <h1 className="font-serif text-3xl font-semibold text-navy-800">Create your account</h1>
      <p className="mt-2 text-navy-800/60">Join Gurukul Library in under a minute.</p>

      {plan && (
        <div className="mt-4 rounded-lg bg-navy-50 px-4 py-3 text-sm text-navy-800">
          Selected plan: <span className="font-medium">{plan.name}</span> — ₹{plan.price} /{" "}
          {plan.duration_days} days
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Field label="Full Name">
          <input
            required
            className="input"
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
        </Field>
        <Field label="Phone">
          <input
            required
            type="tel"
            className="input"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
        </Field>
        <Field label="Email">
          <input
            required
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </Field>
        <Field label="Password">
          <input
            required
            minLength={8}
            type="password"
            className="input"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </Field>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? "Creating account…" : "Create Account"}
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-navy-800">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
