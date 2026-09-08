"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Plus, X } from "lucide-react";

interface Payment {
  id: string;
  amount: number;
  payment_date: string;
  method: string | null;
  transaction_id: string | null;
  status: string;
  members: { membership_id: string; profiles: { full_name: string } | null } | null;
  membership_plans: { name: string } | null;
}

interface MemberOption {
  id: string;
  membership_id: string;
  plan_id: string | null;
  profiles: { full_name: string } | null;
  membership_plans: { name: string; price: number } | null;
}

export default function AdminPaymentsPage() {
  const supabase = createClient();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data }, { data: memberData }] = await Promise.all([
      supabase
        .from("payments")
        .select("id, amount, payment_date, method, transaction_id, status, members(membership_id, profiles(full_name)), membership_plans(name)")
        .order("payment_date", { ascending: false }),
      supabase
        .from("members")
        .select("id, membership_id, plan_id, profiles(full_name), membership_plans(name, price)"),
    ]);
    setPayments((data as unknown as Payment[]) ?? []);
    setMembers((memberData as unknown as MemberOption[]) ?? []);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  async function updateStatus(payment: Payment, status: string) {
    await supabase.from("payments").update({ status }).eq("id", payment.id);
    load();
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl font-semibold text-navy-800">Payments</h1>
          <p className="mt-1 text-sm text-navy-800/60">
            Manual records for now — Razorpay order/signature fields already exist in the schema
            for when online payment goes live.
          </p>
        </div>
        <button onClick={() => setModalOpen(true)} className="btn-primary">
          <Plus size={16} className="mr-2" /> Record Payment
        </button>
      </div>

      {loading ? (
        <p className="mt-10 text-navy-800/50">Loading…</p>
      ) : payments.length === 0 ? (
        <p className="mt-10 text-navy-800/50">No payment records yet.</p>
      ) : (
        <div className="mt-8 overflow-hidden rounded-xl2 bg-white shadow-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy-100 text-xs uppercase tracking-wide text-navy-800/50">
              <tr>
                <th className="px-5 py-3">Member</th>
                <th className="px-5 py-3">Plan</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p.id} className="border-b border-navy-50 last:border-0">
                  <td className="px-5 py-3 font-medium text-navy-800">
                    {p.members?.profiles?.full_name} ({p.members?.membership_id})
                  </td>
                  <td className="px-5 py-3">{p.membership_plans?.name ?? "—"}</td>
                  <td className="px-5 py-3">₹{p.amount}</td>
                  <td className="px-5 py-3">{p.payment_date?.slice(0, 10)}</td>
                  <td className="px-5 py-3 capitalize">{p.method ?? "—"}</td>
                  <td className="px-5 py-3">
                    <select
                      value={p.status}
                      onChange={(e) => updateStatus(p, e.target.value)}
                      className="rounded-lg border border-navy-100 px-2 py-1 text-sm capitalize"
                    >
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                      <option value="failed">Failed</option>
                      <option value="refunded">Refunded</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modalOpen && (
        <PaymentModal
          members={members}
          onClose={() => setModalOpen(false)}
          onSaved={() => { setModalOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function PaymentModal({
  members,
  onClose,
  onSaved,
}: {
  members: MemberOption[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const supabase = createClient();
  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [transactionId, setTransactionId] = useState("");
  const [status, setStatus] = useState("paid");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedMember = members.find((m) => m.id === memberId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!memberId || !amount) {
      setError("Member and amount are required.");
      return;
    }
    setSaving(true);
    const { error: saveError } = await supabase.from("payments").insert({
      member_id: memberId,
      plan_id: selectedMember?.plan_id ?? null,
      amount: Number(amount),
      method,
      transaction_id: transactionId.trim() || null,
      status,
    });
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    onSaved();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-900/40 p-4">
      <div className="w-full max-w-sm rounded-xl2 bg-white p-6 shadow-soft">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-semibold text-navy-800">Record Payment</h2>
          <button onClick={onClose}><X size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Member</span>
            <select
              className="input mt-1"
              value={memberId}
              onChange={(e) => {
                setMemberId(e.target.value);
                const m = members.find((mm) => mm.id === e.target.value);
                if (m?.membership_plans?.price) setAmount(m.membership_plans.price.toString());
              }}
            >
              <option value="">Select member…</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.profiles?.full_name} ({m.membership_id})
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Amount (₹)</span>
            <input required type="number" min="0" className="input mt-1" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-navy-800">Method</span>
              <select className="input mt-1" value={method} onChange={(e) => setMethod(e.target.value)}>
                <option value="cash">Cash</option>
                <option value="upi">UPI</option>
                <option value="card">Card</option>
                <option value="razorpay">Razorpay</option>
                <option value="other">Other</option>
              </select>
            </label>
            <label className="block">
              <span className="text-sm font-medium text-navy-800">Status</span>
              <select className="input mt-1" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="paid">Paid</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="refunded">Refunded</option>
              </select>
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Transaction ID (optional)</span>
            <input className="input mt-1" value={transactionId} onChange={(e) => setTransactionId(e.target.value)} />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancel</button>
            <button type="submit" disabled={saving} className="btn-primary flex-1">{saving ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
