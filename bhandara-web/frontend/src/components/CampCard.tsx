import Link from "next/link";
import { Camp } from "@/lib/api";

function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

function formatTime(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${m} ${ampm}`;
}

function getDistanceText(camp: Camp, userLat?: number, userLng?: number) {
  if (userLat === undefined || userLng === undefined) return null;
  const R = 6371;
  const dLat = ((camp.latitude - userLat) * Math.PI) / 180;
  const dLon = ((camp.longitude - userLng) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((userLat * Math.PI) / 180) *
      Math.cos((camp.latitude * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const dist = R * c;
  return dist < 1 ? `${Math.round(dist * 1000)}m` : `${dist.toFixed(1)} km`;
}

function getCampStatus(camp: Camp): "active" | "upcoming" {
  const now = new Date();
  const nowTime = now.toTimeString().slice(0, 5);

  if (camp.is_recurring) {
    if (camp.end_time && nowTime > camp.end_time) return "upcoming";
    if (nowTime >= camp.start_time) return "active";
    return "upcoming";
  }

  const todayStr = now.toISOString().split("T")[0];
  if (camp.date > todayStr) return "upcoming";
  if (camp.date < todayStr) return "upcoming";

  if (camp.end_time && nowTime > camp.end_time) return "upcoming";
  if (nowTime >= camp.start_time) return "active";
  return "upcoming";
}

interface CampCardProps {
  camp: Camp;
  userLat?: number;
  userLng?: number;
}

export default function CampCard({ camp, userLat, userLng }: CampCardProps) {
  const distance = getDistanceText(camp, userLat, userLng);
  const status = getCampStatus(camp);
  const isActive = status === "active";

  return (
    <Link href={`/camp/${camp.id}`} className="block group">
      <div className={`bg-white rounded-2xl border overflow-hidden transition-all duration-200 group-hover:shadow-md group-hover:-translate-y-0.5 ${
        isActive
          ? "border-green-300 shadow-sm shadow-green-100"
          : "border-border shadow-sm"
      }`}>
        {/* Image banner */}
        {camp.image_url && (
          <div className="h-36 bg-gray-100 overflow-hidden relative">
            <img
              src={camp.image_url}
              alt={camp.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        )}

        <div className="p-4">
          {/* Header row: title + badges */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {/* Camp icon */}
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                isActive ? "bg-green-100" : "bg-emerald-50"
              }`}>
                <svg className={`w-5 h-5 ${isActive ? "text-green-600" : "text-emerald-600"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75l-1.5.75a3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0 3.354 3.354 0 00-3 0 3.354 3.354 0 01-3 0L3 16.5m15-3.379a48.474 48.474 0 00-6-.371c-2.032 0-4.034.126-6 .371m12 0c.39.049.777.102 1.163.16 1.07.16 1.837 1.094 1.837 2.175v5.169c0 .621-.504 1.125-1.125 1.125H4.125A1.125 1.125 0 013 20.625v-5.17c0-1.08.768-2.014 1.837-2.174A47.78 47.78 0 016 13.12M12.265 3.11a.375.375 0 11-.53 0L12 2.845l.265.265z" />
                </svg>
              </div>
              <h3 className="font-semibold text-[15px] leading-snug truncate">{camp.title}</h3>
            </div>

            {/* Status badge */}
            {isActive ? (
              <span className="text-[10px] bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1 shrink-0">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                Live
              </span>
            ) : (
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium shrink-0">
                Upcoming
              </span>
            )}
          </div>

          {/* Tags row */}
          <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
            {camp.is_recurring && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-medium border border-amber-100">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Daily
              </span>
            )}
            {camp.source !== "user" && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full font-medium border border-emerald-100">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Verified
              </span>
            )}
            {distance && (
              <span className="inline-flex items-center gap-1 text-[10px] bg-sky-50 text-sky-700 px-2 py-0.5 rounded-full font-medium border border-sky-100">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
                {distance}
              </span>
            )}
          </div>

          {/* Divider */}
          <div className="my-3 h-px bg-gray-100" />

          {/* Info row */}
          <div className="flex items-center gap-4 text-[13px] text-muted">
            {/* Address */}
            <span className="flex items-center gap-1.5 min-w-0 flex-1">
              <svg className="w-3.5 h-3.5 shrink-0 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
              <span className="truncate">{camp.address}</span>
            </span>
          </div>

          {/* Date & Time row */}
          <div className="mt-2 flex items-center gap-4 text-[13px] text-muted">
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
              </svg>
              {camp.is_recurring ? "Every day" : formatDate(camp.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {formatTime(camp.start_time)}
              {camp.end_time && ` - ${formatTime(camp.end_time)}`}
            </span>
          </div>

          {/* Footer: share button */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[11px] text-muted/60">Tap for details</span>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                const url = `${window.location.origin}/camp/${camp.id}`;
                const text = `${camp.title} — free food at ${camp.address}`;
                if (navigator.share) {
                  navigator.share({ title: camp.title, text, url });
                } else {
                  navigator.clipboard.writeText(url);
                  alert("Link copied!");
                }
              }}
              className="p-1.5 -mr-1 rounded-lg text-muted/50 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
              aria-label="Share camp"
              title="Share"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
