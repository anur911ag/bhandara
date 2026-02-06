const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Camp {
  id: string;
  title: string;
  description?: string;
  address: string;
  latitude: number;
  longitude: number;
  date: string;
  start_time: string;
  end_time?: string;
  organizer_name?: string;
  organizer_phone?: string;
  image_url?: string;
  source: string;
  is_active: boolean;
  is_recurring: boolean;
  created_at: string;
}

interface CampListResponse {
  camps: Camp[];
  total: number;
}

export async function fetchCamps(params: {
  lat?: number;
  lng?: number;
  radius_km?: number;
  city?: string;
  page?: number;
  limit?: number;
}): Promise<CampListResponse> {
  const searchParams = new URLSearchParams();

  if (params.lat !== undefined) searchParams.set("lat", String(params.lat));
  if (params.lng !== undefined) searchParams.set("lng", String(params.lng));
  if (params.radius_km) searchParams.set("radius_km", String(params.radius_km));
  if (params.city) searchParams.set("city", params.city);
  if (params.page) searchParams.set("page", String(params.page));
  if (params.limit) searchParams.set("limit", String(params.limit));

  const res = await fetch(`${API_BASE}/api/camps?${searchParams.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch camps");
  return res.json();
}

export async function fetchCamp(id: string): Promise<Camp> {
  const res = await fetch(`${API_BASE}/api/camps/${id}`);
  if (!res.ok) throw new Error("Camp not found");
  return res.json();
}

export async function createCamp(formData: FormData): Promise<Camp> {
  const res = await fetch(`${API_BASE}/api/camps`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ detail: "Failed to create camp" }));
    throw new Error(error.detail || "Failed to create camp");
  }
  return res.json();
}

export type CityOption = {
  name: string;
  lat: number;
  lng: number;
};

