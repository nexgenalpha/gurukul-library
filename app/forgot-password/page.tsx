"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);
    if (resetError) {
      setError(resetError.message);
      return;
    }
    setSent(true);
  }

  return (
    <div className="section max-w-md">
      <h1 className="font-serif text-3xl font-semibold text-navy-800">Reset your password</h1>
      <p className="mt-2 text-navy-800/60">
        Enter your account email and we'll send you a reset link.
      </p>

      {sent ? (
        <div className="card mt-8">
          <p className="text-navy-800">
            If an account exists for <span className="font-medium">{email}</span>, a reset link
            has been sent.
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm text-navy-600 hover:underline">
            ← Back to login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Email</span>
            <input
              required
              type="email"
              className="input mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Sending…" : "Send Reset Link"}
          </button>
        </form>
      )}
    </div>
  );
}
