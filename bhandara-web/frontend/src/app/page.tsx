"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/Header";
import CampCard from "@/components/CampCard";
import CitySelector from "@/components/CitySelector";
import { Camp, CityOption, fetchCamps } from "@/lib/api";
import { useLocation } from "@/lib/useLocation";
import { reverseGeocode } from "@/lib/geocode";

const STORAGE_KEY = "bhandara_selected_city";

function saveCity(city: CityOption | null) {
  try {
    if (city) {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(city));
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  } catch {}
}

function loadCity(): CityOption | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.lat === "number" && typeof parsed.lng === "number" && parsed.name) {
      return parsed as CityOption;
    }
  } catch {}
  return null;
}

export default function HomePage() {
  const { latitude, longitude, error: locationError, loading: locationLoading, requestLocation } = useLocation();
  const [camps, setCamps] = useState<Camp[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const [page, setPage] = useState(1);
  const [gpsRequested, setGpsRequested] = useState(false);
  const [resolvingName, setResolvingName] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const LIMIT = 20;
  const CITY_RADIUS = 80;

  const gpsReady = latitude != null && longitude != null;

  // Restore selected city from sessionStorage on mount
  useEffect(() => {
    const saved = loadCity();
    if (saved) setSelectedCity(saved);
    setInitialized(true);
  }, []);

  // Determine active coords
  const activeLat = selectedCity ? selectedCity.lat : null;
  const activeLng = selectedCity ? selectedCity.lng : null;

  // When GPS coords arrive after user clicked the button, reverse-geocode to get a place name
  useEffect(() => {
    if (!gpsRequested || !gpsReady) return;

    let cancelled = false;
    setResolvingName(true);

    reverseGeocode(latitude!, longitude!).then((name) => {
      if (cancelled) return;
      const shortName = name
        ? name.split(",").slice(0, 2).map((s) => s.trim()).join(", ")
        : "Your Location";

      const city = { name: shortName, lat: latitude!, lng: longitude! };
      setSelectedCity(city);
      saveCity(city);
      setGpsRequested(false);
      setResolvingName(false);
    });

    return () => { cancelled = true; };
  }, [gpsRequested, gpsReady, latitude, longitude]);

  const loadCamps = useCallback(async () => {
    if (!selectedCity) return;

    setLoading(true);
    setError(null);
    try {
      const params: Parameters<typeof fetchCamps>[0] = {
        page,
        limit: LIMIT,
        lat: selectedCity.lat,
        lng: selectedCity.lng,
        radius_km: CITY_RADIUS,
        city: selectedCity.name,
      };

      const data = await fetchCamps(params);
      setCamps(data.camps);
      setTotal(data.total);
    } catch {
      setError("Could not load camps. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [selectedCity, page]);

  useEffect(() => {
    if (selectedCity) loadCamps();
  }, [loadCamps, selectedCity]);

  function handleCitySelect(city: CityOption | null) {
    setSelectedCity(city);
    saveCity(city);
    setPage(1);
  }

  function handleClear() {
    setSelectedCity(null);
    saveCity(null);
    setCamps([]);
    setTotal(0);
    setPage(1);
  }

  function handleUseCurrentLocation() {
    setGpsRequested(true);
    if (!gpsReady) {
      requestLocation();
    } else {
      setResolvingName(true);
      reverseGeocode(latitude!, longitude!).then((name) => {
        const shortName = name
          ? name.split(",").slice(0, 2).map((s) => s.trim()).join(", ")
          : "Your Location";
        const city = { name: shortName, lat: latitude!, lng: longitude! };
        setSelectedCity(city);
        saveCity(city);
        setGpsRequested(false);
        setResolvingName(false);
      });
    }
  }

  const totalPages = Math.ceil(total / LIMIT);
  const gpsLoading = (gpsRequested && locationLoading) || resolvingName;

  return (
    <div>
      <Header subtitle="Find free food camps & bhandaras near you" />

      <div className="max-w-lg mx-auto px-4">
        {/* Use current location — standalone button */}
        {!selectedCity && initialized && (
          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={gpsLoading}
            className="mt-4 w-full flex items-center justify-center gap-2.5 py-3.5 bg-white border border-border rounded-2xl text-sm font-medium text-foreground hover:border-emerald-400 hover:shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {gpsLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-muted">{resolvingName ? "Resolving location..." : "Getting your location..."}</span>
              </>
            ) : (
              <>
                <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                Use my current location
              </>
            )}
          </button>
        )}

        {/* GPS error */}
        {gpsRequested && locationError && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
            <p className="text-sm text-amber-800">{locationError}</p>
            <button
              onClick={() => { setGpsRequested(true); requestLocation(); }}
              className="mt-2 text-sm text-emerald-700 font-medium underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Divider between GPS button and search */}
        {!selectedCity && initialized && (
          <div className="flex items-center gap-3 my-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted">or search a city</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        )}

        {/* City search selector */}
        <div className={selectedCity ? "mt-4" : ""}>
          <CitySelector
            selected={selectedCity}
            onSelect={handleCitySelect}
            onClear={handleClear}
          />
        </div>

        {/* No selection prompt */}
        {!selectedCity && !loading && !gpsLoading && initialized && (
          <div className="mt-4 bg-emerald-50/60 border border-emerald-200/60 rounded-2xl p-4 flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
              </svg>
            </div>
            <p className="text-sm text-emerald-800/80 leading-relaxed">
              Use your current location or search a city to discover free food camps near you.
            </p>
          </div>
        )}

        {/* Results info */}
        {!loading && selectedCity && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-muted">
              {total === 0
                ? "No active or upcoming camps found"
                : `${total} camp${total > 1 ? "s" : ""} found`}
            </p>
            <span className="text-xs text-emerald-700 font-medium">{selectedCity.name}</span>
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="mt-10 flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            </div>
            <p className="text-sm text-muted">Finding camps nearby...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-center">
            <p className="text-sm text-red-700">{error}</p>
            <button
              onClick={loadCamps}
              className="mt-2 text-sm text-emerald-700 font-semibold"
            >
              Retry
            </button>
          </div>
        )}

        {/* Camp list */}
        {!loading && camps.length > 0 && (
          <div className="mt-4 flex flex-col gap-3">
            {camps.map((camp) => (
              <CampCard
                key={camp.id}
                camp={camp}
                userLat={activeLat ?? undefined}
                userLng={activeLng ?? undefined}
              />
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && camps.length === 0 && !error && selectedCity && (
          <div className="mt-10 text-center">
            <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center">
              <svg className="w-8 h-8 text-muted/50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
              </svg>
            </div>
            <h3 className="mt-4 font-semibold text-base">No camps found</h3>
            <p className="mt-1.5 text-sm text-muted max-w-xs mx-auto leading-relaxed">
              No active or upcoming camps in {selectedCity.name} right now. Check back later or try a different area.
            </p>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 mb-4 flex items-center justify-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-2 bg-white border border-border rounded-xl text-sm disabled:opacity-30 hover:border-emerald-300 transition-colors flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Prev
            </button>
            <span className="text-xs text-muted px-3">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-2 bg-white border border-border rounded-xl text-sm disabled:opacity-30 hover:border-emerald-300 transition-colors flex items-center gap-1"
            >
              Next
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
