const NOMINATIM_URL = "https://nominatim.openstreetmap.org";

export interface GeocodeSuggestion {
  display_name: string;
  lat: number;
  lon: number;
}

export async function geocodeAddress(query: string): Promise<GeocodeSuggestion[]> {
  if (!query || query.trim().length < 3) return [];

  const params = new URLSearchParams({
    q: query,
    format: "json",
    limit: "5",
    countrycodes: "in",
  });

  const res = await fetch(`${NOMINATIM_URL}/search?${params}`, {
    headers: { "Accept-Language": "en" },
  });

  if (!res.ok) return [];

  const data = await res.json();
  return data.map((item: { display_name: string; lat: string; lon: string }) => ({
    display_name: item.display_name,
    lat: parseFloat(item.lat),
    lon: parseFloat(item.lon),
  }));
}

export async function reverseGeocode(lat: number, lon: number): Promise<string | null> {
  const params = new URLSearchParams({
    lat: String(lat),
    lon: String(lon),
    format: "json",
  });

  const res = await fetch(`${NOMINATIM_URL}/reverse?${params}`, {
    headers: { "Accept-Language": "en" },
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.display_name || null;
}
