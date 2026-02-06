"use client";

import { useState, useCallback } from "react";

interface LocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
  });

  const requestLocation = useCallback(() => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    if (!navigator.geolocation) {
      setState({
        latitude: null,
        longitude: null,
        error: "Geolocation is not supported by your browser",
        loading: false,
      });
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (err) => {
        let message = "Unable to get your location";
        if (err.code === err.PERMISSION_DENIED) {
          message = "Location permission denied. Please enable it in your browser settings.";
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          message = "Location information unavailable";
        } else if (err.code === err.TIMEOUT) {
          message = "Location request timed out";
        }
        setState({
          latitude: null,
          longitude: null,
          error: message,
          loading: false,
        });
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }, []);

  return { ...state, requestLocation };
}
