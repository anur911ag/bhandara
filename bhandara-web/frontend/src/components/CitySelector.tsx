"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { CityOption } from "@/lib/api";
import { geocodeAddress, GeocodeSuggestion } from "@/lib/geocode";

interface CitySelectorProps {
  selected: CityOption | null;
  onSelect: (city: CityOption | null) => void;
  onClear: () => void;
  onUseCurrentLocation?: () => void;
  gpsLoading?: boolean;
  resolvingName?: boolean;
}

function extractPlaceName(displayName: string): string {
  const parts = displayName.split(",").map((p) => p.trim());
  return parts[0] || displayName;
}

export default function CitySelector({ selected, onSelect, onClear, onUseCurrentLocation, gpsLoading, resolvingName }: CitySelectorProps) {
  const [search, setSearch] = useState("");
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [searching, setSearching] = useState(false);
  const [focused, setFocused] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced geocode search
  const doSearch = useCallback(async (query: string) => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }
    setSearching(true);
    try {
      const results = await geocodeAddress(query);
      setSuggestions(results);
    } catch {
      setSuggestions([]);
    } finally {
      setSearching(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(search), 400);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [search, doSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handlePick(suggestion: GeocodeSuggestion) {
    const city: CityOption = {
      name: extractPlaceName(suggestion.display_name),
      lat: suggestion.lat,
      lng: suggestion.lon,
    };
    onSelect(city);
    setSearch("");
    setSuggestions([]);
    setFocused(false);
  }

  function handleClear() {
    onClear();
    setSearch("");
    setSuggestions([]);
  }

  const showDropdown = focused && search.trim().length > 0;

  return (
    <div className="relative" ref={wrapperRef}>
      {/* Active selection chip */}
      {selected && !focused && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-emerald-50 border border-emerald-300 rounded-xl text-sm">
          <svg className="w-4 h-4 text-emerald-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="flex-1 font-medium truncate">{selected.name}</span>
          <button
            type="button"
            onClick={handleClear}
            className="text-emerald-500 hover:text-emerald-700 transition-colors"
            aria-label="Clear location"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => {
              setFocused(true);
              setTimeout(() => inputRef.current?.focus(), 50);
            }}
            className="text-emerald-500 hover:text-emerald-700 text-xs font-medium"
          >
            Change
          </button>
        </div>
      )}

      {/* Use current location button (shown in change/edit mode) */}
      {selected && focused && onUseCurrentLocation && (
        <>
          <button
            type="button"
            onClick={() => {
              onUseCurrentLocation();
              setFocused(false);
            }}
            disabled={gpsLoading}
            className="w-full flex items-center justify-center gap-2.5 py-3 bg-white border border-border rounded-xl text-sm font-medium text-foreground hover:border-emerald-400 hover:shadow-sm transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {gpsLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-muted">{resolvingName ? "Resolving location..." : "Getting your location..."}</span>
              </>
            ) : (
              <>
                <div className="w-7 h-7 rounded-full bg-emerald-100 flex items-center justify-center">
                  <svg className="w-3.5 h-3.5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                </div>
                Use my current location
              </>
            )}
          </button>
          <div className="flex items-center gap-3 my-2">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted">or search a city</span>
            <div className="flex-1 h-px bg-border" />
          </div>
        </>
      )}

      {/* Search input (shown when no selection or when editing) */}
      {(!selected || focused) && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-border rounded-xl focus-within:border-emerald-600 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
          <svg className="w-4 h-4 text-emerald-700 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setFocused(true)}
            placeholder="Search any city, town, or area..."
            className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted"
          />
          {searching && (
            <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin shrink-0" />
          )}
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute z-30 top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {searching && suggestions.length === 0 && (
              <div className="px-4 py-3 text-sm text-muted text-center flex items-center justify-center gap-2">
                <div className="w-3 h-3 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                Searching...
              </div>
            )}

            {!searching && search.trim().length >= 2 && suggestions.length === 0 && (
              <p className="px-4 py-3 text-sm text-muted text-center">
                No places found for &ldquo;{search}&rdquo;
              </p>
            )}

            {suggestions.map((s, i) => (
              <button
                key={`${s.lat}-${s.lon}-${i}`}
                type="button"
                onClick={() => handlePick(s)}
                className="w-full text-left px-4 py-2.5 text-sm hover:bg-emerald-50 transition-colors flex items-start gap-2"
              >
                <svg className="w-4 h-4 text-muted shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <div className="min-w-0">
                  <span className="font-medium block truncate">{extractPlaceName(s.display_name)}</span>
                  <span className="text-xs text-muted block truncate">{s.display_name}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
