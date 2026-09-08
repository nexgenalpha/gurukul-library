import { createClient } from "@/lib/supabase/server";
import type { Settings } from "@/types/database";
import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Contact Gurukul Library — Koyla Nagar, Kanpur.",
};

export default async function ContactPage() {
  const supabase = await createClient();
  const { data } = await supabase.from("settings").select("*").single();
  const settings = data as Settings | null;

  const openingHours = settings?.opening_hours ?? {};
  const hasHours = Object.keys(openingHours).length > 0;

  const whatsappUrl = settings?.whatsapp_number
    ? `https://wa.me/${settings.whatsapp_number.replace(/\D/g, "")}`
    : null;

  return (
    <div className="section">
      <h1 className="font-serif text-3xl font-semibold text-navy-800 sm:text-4xl">Contact Us</h1>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <div className="space-y-6">
          <div className="card flex items-start gap-4">
            <MapPin className="mt-1 shrink-0 text-navy-600" size={20} />
            <div>
              <p className="font-medium text-navy-800">Address</p>
              <p className="text-sm text-navy-800/70">
                {settings?.address ?? "Address not yet configured — set it in Admin Settings."}
              </p>
            </div>
          </div>

          <div className="card flex items-start gap-4">
            <Phone className="mt-1 shrink-0 text-navy-600" size={20} />
            <div>
              <p className="font-medium text-navy-800">Phone</p>
              <p className="text-sm text-navy-800/70">{settings?.phone ?? "Not yet configured"}</p>
            </div>
          </div>

          <div className="card flex items-start gap-4">
            <Mail className="mt-1 shrink-0 text-navy-600" size={20} />
            <div>
              <p className="font-medium text-navy-800">Email</p>
              <p className="text-sm text-navy-800/70">{settings?.email ?? "Not yet configured"}</p>
            </div>
          </div>

          <div className="card flex items-start gap-4">
            <Clock className="mt-1 shrink-0 text-navy-600" size={20} />
            <div>
              <p className="font-medium text-navy-800">Opening Hours</p>
              {hasHours ? (
                <ul className="mt-1 text-sm text-navy-800/70">
                  {Object.entries(openingHours).map(([day, hours]) => (
                    <li key={day}>
                      <span className="capitalize">{day}</span>: {String(hours)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-navy-800/70">Not yet configured</p>
              )}
            </div>
          </div>

          {whatsappUrl && (
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex"
            >
              Message on WhatsApp
            </a>
          )}
        </div>

        <div className="overflow-hidden rounded-xl2 bg-navy-50 shadow-card">
          {settings?.google_maps_embed_url ? (
            <iframe
              src={settings.google_maps_embed_url}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 400 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Gurukul Library location"
            />
          ) : (
            <div className="flex h-full min-h-[400px] items-center justify-center text-center text-sm text-navy-800/50">
              Map will appear here once the Google Maps embed URL is set in Admin Settings.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
