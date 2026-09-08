"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { PlanFormModal } from "@/components/plan-form-modal";
import type { MembershipPlan } from "@/types/database";
import { ArrowUp, ArrowDown, Pencil, Trash2, Plus } from "lucide-react";

export default function AdminPlansPage() {
  const supabase = createClient();
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | undefined>(undefined);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("membership_plans")
      .select("*")
      .order("display_order");
    setPlans((data as MembershipPlan[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditingPlan(undefined);
    setModalOpen(true);
  }

  function openEdit(plan: MembershipPlan) {
    setEditingPlan(plan);
    setModalOpen(true);
  }

  async function handleDelete(plan: MembershipPlan) {
    if (!confirm(`Delete "${plan.name}"? Members already on this plan will keep their record, but it will disappear from the public site.`)) {
      return;
    }
    await supabase.from("membership_plans").delete().eq("id", plan.id);
    load();
  }

  async function toggleActive(plan: MembershipPlan) {
    await supabase.from("membership_plans").update({ is_active: !plan.is_active }).eq("id", plan.id);
    load();
  }

  async function move(plan: MembershipPlan, direction: "up" | "down") {
    const index = plans.findIndex((p) => p.id === plan.id);
    const swapWith = direction === "up" ? plans[index - 1] : plans[index + 1];
    if (!swapWith) return;

    // Swap display_order values so the ordering persists across reloads.
    await Promise.all([
      supabase.from("membership_plans").update({ display_order: swapWith.display_order }).eq("id", plan.id),
      supabase.from("membership_plans").update({ display_order: plan.display_order }).eq("id", swapWith.id),
    ]);
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-800">Membership Plans</h1>
          <p className="mt-1 text-sm text-navy-800/60">
            These drive the public Membership page and the plan picker on registration.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} className="mr-2" /> New Plan
        </button>
      </div>

      {loading ? (
        <p className="mt-10 text-navy-800/50">Loading plans…</p>
      ) : plans.length === 0 ? (
        <p className="mt-10 text-navy-800/50">No plans yet. Create your first one.</p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl2 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-800/50">
              <tr>
                <th className="px-5 py-3">Order</th>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Price</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Badge</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan, i) => (
                <tr key={plan.id} className="border-b border-navy-50 last:border-0">
                  <td className="px-5 py-3">
                    <div className="flex gap-1">
                      <button
                        disabled={i === 0}
                        onClick={() => move(plan, "up")}
                        className="rounded p-1 text-navy-800/50 hover:bg-navy-50 disabled:opacity-20"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        disabled={i === plans.length - 1}
                        onClick={() => move(plan, "down")}
                        className="rounded p-1 text-navy-800/50 hover:bg-navy-50 disabled:opacity-20"
                      >
                        <ArrowDown size={14} />
                      </button>
                    </div>
                  </td>
                  <td className="px-5 py-3 font-medium text-navy-800">{plan.name}</td>
                  <td className="px-5 py-3">₹{plan.price}</td>
                  <td className="px-5 py-3">{plan.duration_days} days</td>
                  <td className="px-5 py-3">{plan.badge ?? "—"}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => toggleActive(plan)}
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        plan.is_active
                          ? "bg-green-100 text-green-700"
                          : "bg-navy-100 text-navy-800/60"
                      }`}
                    >
                      {plan.is_active ? "Active" : "Inactive"}
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => openEdit(plan)}
                        className="rounded p-1.5 text-navy-800/60 hover:bg-navy-50"
                        aria-label="Edit"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(plan)}
                        className="rounded p-1.5 text-red-600 hover:bg-red-50"
                        aria-label="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <PlanFormModal
          plan={editingPlan}
          nextDisplayOrder={plans.length}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}
