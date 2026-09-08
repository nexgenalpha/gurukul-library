"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { MembershipPlan } from "@/types/database";
import { X } from "lucide-react";

type FormState = {
  name: string;
  price: string;
  duration_days: string;
  features: string; // one per line in the textarea, joined/split on save
  badge: string;
  is_active: boolean;
};

function toFormState(plan?: MembershipPlan): FormState {
  return {
    name: plan?.name ?? "",
    price: plan?.price?.toString() ?? "",
    duration_days: plan?.duration_days?.toString() ?? "30",
    features: plan?.features?.join("\n") ?? "",
    badge: plan?.badge ?? "",
    is_active: plan?.is_active ?? true,
  };
}

export function PlanFormModal({
  plan,
  nextDisplayOrder,
  onClose,
  onSaved,
}: {
  plan?: MembershipPlan;
  nextDisplayOrder: number;
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [form, setForm] = useState<FormState>(toFormState(plan));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const price = Number(form.price);
    const duration_days = Number(form.duration_days);
    if (!form.name.trim() || Number.isNaN(price) || price < 0 || Number.isNaN(duration_days) || duration_days <= 0) {
      setError("Please enter a valid name, price, and duration.");
      return;
    }

    setSaving(true);
    const payload = {
      name: form.name.trim(),
      price,
      duration_days,
      features: form.features
        .split("\n")
        .map((f) => f.trim())
        .filter(Boolean),
      badge: form.badge.trim() || null,
      is_active: form.is_active,
    };

    const query = plan
      ? supabase.from("membership_plans").update(payload).eq("id", plan.id)
      : supabase.from("membership_plans").insert({ ...payload, display_order: nextDisplayOrder });

    const { error: saveError } = await query;
    setSaving(false);

    if (saveError) {
      setError(saveError.message);
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-4">
      <div className="w-full max-w-md rounded-xl2 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-navy-800">
            {plan ? "Edit Plan" : "New Plan"}
          </h2>
          <button onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Plan Name</span>
            <input
              required
              className="input mt-1"
              placeholder="e.g. Quarterly"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </label>

          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-navy-800">Price (₹)</span>
              <input
                required
                type="number"
                min="0"
                className="input mt-1"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-navy-800">Duration (days)</span>
              <input
                required
                type="number"
                min="1"
                className="input mt-1"
                value={form.duration_days}
                onChange={(e) => setForm({ ...form, duration_days: e.target.value })}
              />
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium text-navy-800">Features (one per line)</span>
            <textarea
              className="input mt-1 min-h-[100px]"
              placeholder={"Dedicated seat\nHigh-speed Wi-Fi\n12-hour access"}
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-navy-800">Badge (optional)</span>
            <input
              className="input mt-1"
              placeholder="e.g. Most Popular"
              value={form.badge}
              onChange={(e) => setForm({ ...form, badge: e.target.value })}
            />
          </label>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            <span className="text-sm text-navy-800">Active (visible on public site)</span>
          </label>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">
              {saving ? "Saving…" : "Save Plan"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
