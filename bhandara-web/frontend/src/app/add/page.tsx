"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import { createCamp } from "@/lib/api";
import { useLocation } from "@/lib/useLocation";
import { geocodeAddress, reverseGeocode, GeocodeSuggestion } from "@/lib/geocode";

export default function AddCampPage() {
  const router = useRouter();
  const { latitude, longitude, loading: locLoading, requestLocation } = useLocation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [form, setForm] = useState({
    title: "",
    description: "",
    address: "",
    date: "",
    start_time: "",
    end_time: "",
    organizer_name: "",
    organizer_phone: "",
  });
  const [isRecurring, setIsRecurring] = useState(false);
  const [resolvedLat, setResolvedLat] = useState<number | null>(null);
  const [resolvedLng, setResolvedLng] = useState<number | null>(null);
  const [locationMode, setLocationMode] = useState<"gps" | "search" | null>(null);
  const [suggestions, setSuggestions] = useState<GeocodeSuggestion[]>([]);
  const [searchingAddress, setSearchingAddress] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);

  const today = new Date().toISOString().split("T")[0];

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  // Debounced address search for suggestions
  function handleAddressChange(e: React.ChangeEvent<HTMLInputElement>) {
    const value = e.target.value;
    setForm((prev) => ({ ...prev, address: value }));

    if (locationMode === "search") {
      setResolvedLat(null);
      setResolvedLng(null);
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (value.trim().length < 3) {
      setSuggestions([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearchingAddress(true);
      const results = await geocodeAddress(value);
      setSuggestions(results);
      setSearchingAddress(false);
    }, 500);
  }

  function pickSuggestion(s: GeocodeSuggestion) {
    setForm((prev) => ({ ...prev, address: s.display_name }));
    setResolvedLat(s.lat);
    setResolvedLng(s.lon);
    setLocationMode("search");
    setSuggestions([]);
    setError(null);
  }

  async function useCurrentLocation() {
    if (!latitude || !longitude) {
      setGpsLoading(true);
      requestLocation();
      return;
    }
    setResolvedLat(latitude);
    setResolvedLng(longitude);
    setLocationMode("gps");
    setSuggestions([]);

    const addr = await reverseGeocode(latitude, longitude);
    if (addr) {
      setForm((prev) => ({ ...prev, address: addr }));
    }
  }

  // When GPS coords arrive after clicking the button
  useEffect(() => {
    if (gpsLoading && latitude && longitude) {
      setGpsLoading(false);
      setResolvedLat(latitude);
      setResolvedLng(longitude);
      setLocationMode("gps");
      setSuggestions([]);
      reverseGeocode(latitude, longitude).then((addr) => {
        if (addr) setForm((prev) => ({ ...prev, address: addr }));
      });
    }
  }, [gpsLoading, latitude, longitude]);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      setError("Image must be under 2MB");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setImagePreview(reader.result as string);
    reader.readAsDataURL(file);
    setError(null);
  }

  function removeImage() {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.title.trim()) { setError("Camp name is required"); return; }
    if (!form.address.trim()) { setError("Address is required"); return; }
    if (!isRecurring && !form.date) { setError("Date is required"); return; }
    if (!form.start_time) { setError("Start time is required"); return; }

    let lat = resolvedLat;
    let lng = resolvedLng;

    if (lat === null || lng === null) {
      setSubmitting(true);
      const results = await geocodeAddress(form.address);
      if (results.length > 0) {
        lat = results[0].lat;
        lng = results[0].lon;
        setResolvedLat(lat);
        setResolvedLng(lng);
      } else {
        setSubmitting(false);
        setError("Could not find that location. Please pick from suggestions or use current location.");
        return;
      }
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("address", form.address.trim());
      formData.append("date", isRecurring ? today : form.date);
      formData.append("start_time", form.start_time);
      formData.append("latitude", String(lat));
      formData.append("longitude", String(lng));
      formData.append("is_recurring", String(isRecurring));

      if (form.end_time) formData.append("end_time", form.end_time);
      if (form.description.trim()) formData.append("description", form.description.trim());
      if (form.organizer_name.trim()) formData.append("organizer_name", form.organizer_name.trim());
      if (form.organizer_phone.trim()) formData.append("organizer_phone", form.organizer_phone.trim());
      if (imageFile) formData.append("image", imageFile);

      await createCamp(formData);
      setSuccess(true);
      setTimeout(() => router.push("/"), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create camp");
    } finally {
      setSubmitting(false);
    }
  }

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  if (success) {
    return (
      <div>
        <Header title="Camp Posted!" subtitle="Thank you for sharing" />
        <div className="max-w-lg mx-auto px-4 mt-12 text-center">
          <svg className="w-16 h-16 text-emerald-600 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="mt-4 text-xl font-bold">Camp posted successfully!</h2>
          <p className="mt-2 text-sm text-muted">Redirecting to home...</p>
        </div>
      </div>
    );
  }

  const hasCoords = resolvedLat !== null && resolvedLng !== null;

  return (
    <div>
      <Header title="Post a Camp" subtitle="Help others find free food near them" />

      <form id="add-camp-form" onSubmit={handleSubmit} className="max-w-lg mx-auto px-4 py-6 space-y-5">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl p-3">
            {error}
          </div>
        )}

        {/* Camp Name */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Camp / Bhandara Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="e.g. Gurudwara Langar, Shiv Bhandara"
            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
            maxLength={200}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Description</label>
          <textarea
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="What food is being served? Any special details..."
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 resize-none"
            maxLength={1000}
          />
        </div>

        {/* Location section */}
        <div>
          <label className="block text-sm font-medium mb-1.5">
            Location <span className="text-red-500">*</span>
          </label>

          {/* Use current location button */}
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locLoading || gpsLoading}
            className="w-full mb-3 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-emerald-400 bg-emerald-50 text-sm font-medium text-emerald-800 hover:bg-emerald-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {locLoading || gpsLoading ? (
              <>
                <span className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                Getting location...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Use my current location
              </>
            )}
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted">or type address</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Address search with autocomplete */}
          <div className="relative">
            <input
              type="text"
              name="address"
              value={form.address}
              onChange={handleAddressChange}
              placeholder="Search for a place, area or city..."
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              maxLength={500}
              autoComplete="off"
            />
            {searchingAddress && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              </div>
            )}

            {/* Suggestions dropdown */}
            {suggestions.length > 0 && (
              <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => pickSuggestion(s)}
                    className="w-full text-left px-4 py-3 text-sm hover:bg-emerald-50 transition-colors border-b border-border last:border-b-0 flex items-start gap-2"
                  >
                    <svg className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="leading-snug">{s.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Location confirmation badge */}
          {hasCoords && (
            <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Location set{locationMode === "gps" ? " (GPS)" : " (from address)"}
            </div>
          )}
        </div>

        {/* Recurring toggle */}
        <div>
          <label className="flex items-center gap-3 cursor-pointer select-none">
            <div className="relative">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => {
                  setIsRecurring(e.target.checked);
                  if (e.target.checked) {
                    setForm((prev) => ({ ...prev, date: "" }));
                  }
                }}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-gray-200 rounded-full peer-checked:bg-emerald-600 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow peer-checked:translate-x-4 transition-transform" />
            </div>
            <div>
              <span className="text-sm font-medium">This camp runs daily</span>
              <span className="block text-xs text-muted">e.g. Gurudwara langar, temple prasadam</span>
            </div>
          </label>
        </div>

        {/* Date — hidden when recurring */}
        {!isRecurring && (
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              min={today}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none h-[46px]"
            />
          </div>
        )}

        {/* Time */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Start Time <span className="text-red-500">*</span>
            </label>
            <input
              type="time"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none h-[46px]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">End Time</label>
            <input
              type="time"
              name="end_time"
              value={form.end_time}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 appearance-none h-[46px]"
            />
          </div>
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-medium mb-1.5">Photo (optional, max 2MB)</label>
          {imagePreview ? (
            <div className="relative">
              <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-xl" />
              <button
                type="button"
                onClick={removeImage}
                className="absolute top-2 right-2 bg-black/60 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg"
              >
                ×
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-emerald-500 transition-colors">
              <svg className="w-8 h-8 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="mt-2 text-xs text-muted">Tap to add photo</span>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}
        </div>

        {/* Organizer info */}
        <div className="border-t border-border pt-5">
          <p className="text-sm font-medium mb-3 text-muted">Organizer Details (optional)</p>
          <div className="space-y-3">
            <input
              type="text"
              name="organizer_name"
              value={form.organizer_name}
              onChange={handleChange}
              placeholder="Organizer name"
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              maxLength={200}
            />
            <input
              type="tel"
              name="organizer_phone"
              value={form.organizer_phone}
              onChange={handleChange}
              placeholder="Contact number"
              className="w-full px-4 py-3 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
              maxLength={20}
            />
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3.5 bg-gradient-to-r from-emerald-700 to-emerald-800 text-white rounded-xl font-semibold text-sm hover:from-emerald-800 hover:to-emerald-900 transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
        >
          {submitting ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Posting...
            </span>
          ) : (
            "Post Free Bhandara"
          )}
        </button>
      </form>
    </div>
  );
}
