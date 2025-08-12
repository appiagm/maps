import { useState, useCallback, useRef } from 'react';
import { placesCache } from '../services/placesCache';

import { sessionTokenManager } from '../services/sessionTokenManager';
import { Maps_API_KEY } from '../constants/AppData';

interface PlaceResult {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

interface UseCachedPlacesProps {
  onLocationSelect?: (location: { latitude: number; longitude: number; address: string }) => void;
  userLocation?: { latitude: number; longitude: number } | null;
  userId?: string;
  countryCode?: string;
}

export const useCachedPlaces = ({ onLocationSelect, userLocation, userId, countryCode }: UseCachedPlacesProps) => {
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [query, setQuery] = useState('');
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentSessionTokenRef = useRef<string | null>(null);
  const lastRequestTimeRef = useRef<number>(0);
  const THROTTLE_MS = 1000;

  const searchPlaces = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 3) {
      setResults([]);
      return;
    }

    const now = Date.now();
    if (now - lastRequestTimeRef.current < THROTTLE_MS) {
      return;
    }
    lastRequestTimeRef.current = now;

    // Create or get session token for this search session
    if (!currentSessionTokenRef.current) {
      currentSessionTokenRef.current = sessionTokenManager.createSessionToken();
    }

    // Check cache first
    const cachedResults = placesCache.get(searchQuery);
    if (cachedResults) {
      setResults(cachedResults);
      return;
    }

    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    setIsLoading(true);

    try {
      // Build the API URL
      const baseUrl = 'https://maps.googleapis.com/maps/api/place/autocomplete/json';

      // If we have a user location, compute a ~50km bounding box and enforce strict bounds
      let boundsParam: string | undefined;
      let strictBoundsParam: string | undefined;
      const SEARCH_RADIUS_KM = 50;
      if (userLocation) {
        const lat = userLocation.latitude;
        const lng = userLocation.longitude;
        const latDelta = SEARCH_RADIUS_KM / 110.574; // ~km per degree latitude
        const lngDelta = SEARCH_RADIUS_KM / (111.320 * Math.cos((lat * Math.PI) / 180));
        const south = lat - latDelta;
        const north = lat + latDelta;
        const west = lng - lngDelta;
        const east = lng + lngDelta;
        boundsParam = `${south},${west}|${north},${east}`;
        strictBoundsParam = 'true';
      }

      const params = new URLSearchParams({
        input: searchQuery,
        key: Maps_API_KEY,
        language: 'en',
        types: 'address',
        ...(userLocation && {
          location: `${userLocation.latitude},${userLocation.longitude}`,
          radius: '50000',
        }) as any,
        ...(boundsParam ? { bounds: boundsParam } : {}) as any,
        ...(strictBoundsParam ? { strictbounds: strictBoundsParam } : {}) as any,
        ...(currentSessionTokenRef.current ? { sessiontoken: currentSessionTokenRef.current } : {}) as any,
        ...(countryCode ? { components: `country:${countryCode}` } : {}) as any,
      } as any);

      const apiParameters = {
        input: searchQuery,
        key: Maps_API_KEY,
        language: 'en',
        types: 'address',
        ...(userLocation && {
          location: `${userLocation.latitude},${userLocation.longitude}`,
          radius: '50000',
        }),
        ...(boundsParam ? { bounds: boundsParam } : {}),
        ...(strictBoundsParam ? { strictbounds: strictBoundsParam } : {}),
        ...(currentSessionTokenRef.current ? { sessiontoken: currentSessionTokenRef.current } : {}),
        ...(countryCode ? { components: `country:${countryCode}` } : {}),
      } as Record<string, any>;

      // Add this autocomplete request to the current session token
      if (currentSessionTokenRef.current) {
        sessionTokenManager.addAutocompleteRequest(
          currentSessionTokenRef.current,
          searchQuery,
          apiParameters
        );
      }

      const response = await fetch(`${baseUrl}?${params}`, {
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === 'OK' && data.predictions) {
        // Cache the results
        placesCache.set(searchQuery, data.predictions);
        setResults(data.predictions);
      } else {
        setResults([]);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        return;
      }
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, [userLocation, countryCode]);

  const handlePlaceSelect = useCallback(async (place: PlaceResult) => {
    try {
      // Get place details
      const detailsUrl = 'https://maps.googleapis.com/maps/api/place/details/json';
      const params = new URLSearchParams({
        place_id: place.place_id,
        key: Maps_API_KEY,
        fields: 'geometry,formatted_address',
        ...(currentSessionTokenRef.current ? { sessiontoken: currentSessionTokenRef.current } : {}) as any,
      } as any);

      const apiParameters = {
        place_id: place.place_id,
        key: Maps_API_KEY,
        fields: 'geometry,formatted_address',
        ...(currentSessionTokenRef.current ? { sessiontoken: currentSessionTokenRef.current } : {}),
      } as Record<string, any>;

      // Complete the session with place details request
      if (currentSessionTokenRef.current) {
        sessionTokenManager.completeSession(
          currentSessionTokenRef.current,
          place.place_id,
          apiParameters
        );
        // Clear the session token
        currentSessionTokenRef.current = null;
      }

      const response = await fetch(`${detailsUrl}?${params}`);
      const data = await response.json();

      if (data.status === 'OK' && data.result?.geometry?.location) {
        const location = {
          latitude: data.result.geometry.location.lat,
          longitude: data.result.geometry.location.lng,
          address: place.description
        };

        onLocationSelect?.(location);
      }
    } catch (error) {
      // Swallow errors; UI already cleared in failure path
    }
  }, [onLocationSelect]);

  const clearResults = useCallback(() => {
    setResults([]);
    setQuery('');
    
    // If we have an active session token and no results, consider it expired
    if (currentSessionTokenRef.current && results.length === 0) {
      currentSessionTokenRef.current = null;
    }
  }, [results.length]);

  // Clear only the results list, keep the current query intact
  const clearResultsOnly = useCallback(() => {
    setResults([]);
  }, []);

  return {
    results,
    isLoading,
    query,
    setQuery,
    searchPlaces,
    handlePlaceSelect,
    clearResults,
    clearResultsOnly
  };
}; 