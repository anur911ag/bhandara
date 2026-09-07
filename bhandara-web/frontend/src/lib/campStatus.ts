import { Camp } from "@/lib/api";

export type CampStatus = "active" | "upcoming" | "expired";

function localDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Match backend _camp_status: dates/times are stored in local (IST) time. */
export function getCampStatus(camp: Camp): CampStatus {
  const now = new Date();
  const nowTime = now.toTimeString().slice(0, 5);
  const todayStr = localDateStr(now);

  if (camp.is_recurring) {
    if (camp.end_time && nowTime > camp.end_time) return "upcoming";
    if (nowTime >= camp.start_time) return "active";
    return "upcoming";
  }

  if (camp.date < todayStr) return "expired";
  if (camp.date > todayStr) return "upcoming";

  if (camp.end_time && nowTime > camp.end_time) return "expired";
  if (nowTime >= camp.start_time) return "active";
  return "upcoming";
}
