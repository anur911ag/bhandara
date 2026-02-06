"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { Camp, fetchCamp } from "@/lib/api";

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

export default function CampDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [camp, setCamp] = useState<Camp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCamp(id)
      .then(setCamp)
      .catch(() => setError("Camp not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error || !camp) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-4 text-center">
        <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h2 className="mt-4 text-xl font-bold">Camp not found</h2>
        <p className="mt-2 text-sm text-muted">This camp may have been removed or the link is invalid.</p>
        <button
          onClick={() => router.push("/")}
          className="mt-6 px-6 py-2.5 bg-emerald-700 text-white rounded-xl text-sm font-medium hover:bg-emerald-800 transition-colors"
        >
          Go Home
        </button>
      </div>
    );
  }

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${camp.latitude},${camp.longitude}`;

  return (
    <div className="bg-background min-h-dvh">
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-white/90 backdrop-blur-md border-b border-border">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-foreground p-1 -ml-1 rounded-lg hover:bg-gray-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>
          <h1 className="font-semibold text-sm truncate flex-1">{camp.title}</h1>
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: camp.title,
                  text: `Free food at ${camp.address}`,
                  url: window.location.href,
                });
              } else {
                navigator.clipboard.writeText(window.location.href);
                alert("Link copied!");
              }
            }}
            className="p-1.5 rounded-lg text-muted hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
            aria-label="Share"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="max-w-lg mx-auto">
        {/* Hero image */}
        {camp.image_url && (
          <div className="h-52 bg-gray-100 relative">
            <img src={camp.image_url} alt={camp.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          </div>
        )}

        <div className="px-4 py-5 space-y-5">
          {/* Title & badges */}
          <div>
            <h2 className="text-xl font-bold leading-tight">{camp.title}</h2>
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {camp.is_recurring && (
                <span className="inline-flex items-center gap-1 text-xs bg-amber-50 text-amber-700 px-2.5 py-1 rounded-full font-medium border border-amber-100">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Daily
                </span>
              )}
              {camp.source !== "user" && (
                <span className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-medium border border-emerald-100">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Verified
                </span>
              )}
            </div>
            {camp.description && (
              <p className="mt-3 text-sm text-muted leading-relaxed">{camp.description}</p>
            )}
          </div>

          {/* Info cards */}
          <div className="bg-white rounded-2xl border border-border divide-y divide-gray-100 overflow-hidden">
            <InfoRow
              icon={
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              }
              iconBg="bg-red-50"
              iconColor="text-red-500"
              label="Address"
              value={camp.address}
            />
            <InfoRow
              icon={
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
              }
              iconBg="bg-blue-50"
              iconColor="text-blue-500"
              label="Date"
              value={camp.is_recurring ? "Every day (Daily)" : formatDate(camp.date)}
            />
            <InfoRow
              icon={
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              iconBg="bg-purple-50"
              iconColor="text-purple-500"
              label="Time"
              value={`${formatTime(camp.start_time)}${camp.end_time ? ` - ${formatTime(camp.end_time)}` : ""}`}
            />
            {camp.organizer_name && (
              <InfoRow
                icon={
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                  </svg>
                }
                iconBg="bg-emerald-50"
                iconColor="text-emerald-600"
                label="Organizer"
                value={camp.organizer_name}
              />
            )}
            {camp.organizer_phone && (
              <InfoRow
                icon={
                  <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                  </svg>
                }
                iconBg="bg-green-50"
                iconColor="text-green-600"
                label="Phone"
                value={camp.organizer_phone}
                isLink
                href={`tel:${camp.organizer_phone}`}
              />
            )}
          </div>

          {/* Map view */}
          <div>
            <h3 className="text-sm font-semibold mb-2.5 flex items-center gap-2">
              <svg className="w-4 h-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
              Location
            </h3>
            <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
              <iframe
                title="Camp location"
                width="100%"
                height="200"
                style={{ border: 0 }}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.openstreetmap.org/export/embed.html?bbox=${camp.longitude - 0.01},${camp.latitude - 0.007},${camp.longitude + 0.01},${camp.latitude + 0.007}&layer=mapnik&marker=${camp.latitude},${camp.longitude}`}
              />
              <a
                href={`https://www.openstreetmap.org/?mlat=${camp.latitude}&mlon=${camp.longitude}#map=16/${camp.latitude}/${camp.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 text-xs text-emerald-700 font-medium py-2.5 bg-gray-50 hover:bg-emerald-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                </svg>
                View larger map
              </a>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-1">
            <a
              href={mapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-2xl font-semibold text-sm text-center transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
              </svg>
              Get Directions
            </a>
            {camp.organizer_phone && (
              <a
                href={`tel:${camp.organizer_phone}`}
                className="py-3.5 px-5 bg-green-600 hover:bg-green-700 text-white rounded-2xl font-semibold text-sm transition-colors flex items-center gap-2"
              >
                <svg className="w-4.5 h-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
                </svg>
                Call
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  isLink,
  href,
}: {
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: string;
  isLink?: boolean;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 px-4 py-3.5">
      <div className={`w-9 h-9 rounded-xl ${iconBg} flex items-center justify-center shrink-0 ${iconColor}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-[11px] text-muted uppercase tracking-wide">{label}</p>
        <p className={`text-sm font-medium mt-0.5 ${isLink ? "text-emerald-700 underline underline-offset-2" : ""}`}>{value}</p>
      </div>
    </div>
  );

  if (isLink && href) {
    return <a href={href} className="block hover:bg-gray-50 transition-colors">{content}</a>;
  }

  return <div>{content}</div>;
}
