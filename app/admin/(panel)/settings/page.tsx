"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Settings } from "@/types/database";

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

export default function AdminSettingsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [form, setForm] = useState({
    library_name: "",
    phone: "",
    whatsapp_number: "",
    email: "",
    address: "",
    google_maps_url: "",
    google_maps_embed_url: "",
    facebook: "",
    instagram: "",
  });
  const [hours, setHours] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase
      .from("settings")
      .select("*")
      .single()
      .then(({ data }) => {
        const s = data as Settings | null;
        if (s) {
          setForm({
            library_name: s.library_name ?? "",
            phone: s.phone ?? "",
            whatsapp_number: s.whatsapp_number ?? "",
            email: s.email ?? "",
            address: s.address ?? "",
            google_maps_url: s.google_maps_url ?? "",
            google_maps_embed_url: s.google_maps_embed_url ?? "",
            facebook: (s.social_links as Record<string, string>)?.facebook ?? "",
            instagram: (s.social_links as Record<string, string>)?.instagram ?? "",
          });
          setHours((s.opening_hours as Record<string, string>) ?? {});
        }
        setLoading(false);
      });
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    await supabase
      .from("settings")
      .update({
        library_name: form.library_name,
        phone: form.phone || null,
        whatsapp_number: form.whatsapp_number || null,
        email: form.email || null,
        address: form.address || null,
        google_maps_url: form.google_maps_url || null,
        google_maps_embed_url: form.google_maps_embed_url || null,
        opening_hours: hours,
        social_links: { facebook: form.facebook, instagram: form.instagram },
      })
      .eq("id", true);

    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  if (loading) return <div className="p-8 text-navy-800/50">Loading…</div>;

  return (
    <div className="p-8 max-w-2xl">
      <h1 className="font-serif text-2xl font-semibold text-navy-800">Settings</h1>
      <p className="mt-1 text-sm text-navy-800/60">
        Library name, contact info, and map — used across the whole public site.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-6">
        <div className="card space-y-4">
          <p className="font-medium text-navy-800">General</p>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Library Name</span>
            <input className="input mt-1" value={form.library_name} onChange={(e) => setForm({ ...form, library_name: e.target.value })} />
          </label>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-navy-800">Phone</span>
              <input className="input mt-1" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-navy-800">WhatsApp Number</span>
              <input className="input mt-1" placeholder="+91XXXXXXXXXX" value={form.whatsapp_number} onChange={(e) => setForm({ ...form, whatsapp_number: e.target.value })} />
            </label>
          </div>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Email</span>
            <input type="email" className="input mt-1" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Address</span>
            <textarea className="input mt-1" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </label>
        </div>

        <div className="card space-y-3">
          <p className="font-medium text-navy-800">Opening Hours</p>
          {DAYS.map((day) => (
            <div key={day} className="flex items-center gap-3">
              <span className="w-24 shrink-0 text-sm capitalize text-navy-800/70">{day}</span>
              <input
                className="input"
                placeholder="e.g. 6:00 AM – 10:00 PM, or Closed"
                value={hours[day] ?? ""}
                onChange={(e) => setHours({ ...hours, [day]: e.target.value })}
              />
            </div>
          ))}
        </div>

        <div className="card space-y-4">
          <p className="font-medium text-navy-800">Google Maps</p>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Maps URL (for "Get Directions" links)</span>
            <input className="input mt-1" value={form.google_maps_url} onChange={(e) => setForm({ ...form, google_maps_url: e.target.value })} />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-navy-800">Embed URL (for the Contact page map)</span>
            <input className="input mt-1" placeholder="https://www.google.com/maps/embed?..." value={form.google_maps_embed_url} onChange={(e) => setForm({ ...form, google_maps_embed_url: e.target.value })} />
            <p className="mt-1 text-xs text-navy-800/50">
              Verify this pin points to the correct location before going live.
            </p>
          </label>
        </div>

        <div className="card space-y-4">
          <p className="font-medium text-navy-800">Social Links</p>
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className="text-sm font-medium text-navy-800">Facebook</span>
              <input className="input mt-1" value={form.facebook} onChange={(e) => setForm({ ...form, facebook: e.target.value })} />
            </label>
            <label className="block">
              <span className="text-sm font-medium text-navy-800">Instagram</span>
              <input className="input mt-1" value={form.instagram} onChange={(e) => setForm({ ...form, instagram: e.target.value })} />
            </label>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button type="submit" disabled={saving} className="btn-primary">
            {saving ? "Saving…" : "Save Settings"}
          </button>
          {saved && <span className="text-sm text-green-600">Saved successfully.</span>}
        </div>
      </form>
    </div>
  );
}
