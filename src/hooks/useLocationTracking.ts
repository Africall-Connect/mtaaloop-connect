import { useEffect, useRef, useCallback } from 'react';
import { useRiderStore } from '@/store/riderStore';
import { supabase } from '@/lib/supabaseClient';
import { config } from '@/config/env';
import { useAuth } from '@/hooks/useAuth';

interface RiderLocation {
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  heading: string | null;
  altitude: number | null;
  timestamp: number;
}

interface LocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

export const useLocationTracking = () => {
  const { user } = useAuth();
  const {
    currentLocation,
    setCurrentLocation,
    isLocationTrackingEnabled,
    setLocationTrackingEnabled,
    status,
    updateStatus,
  } = useRiderStore();

  const watchIdRef = useRef<number | null>(null);
  const lastLocationRef = useRef<RiderLocation | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // Get update interval based on rider status
  const getUpdateInterval = useCallback(() => {
    if (!status?.online) return config.location.updateMs.idle;
    if (status.online) return config.location.updateMs.active;
    return config.location.updateMs.idle;
  }, [status?.online]);

  // Log location to database
  const logLocation = useCallback(async (location: RiderLocation) => {
    if (!user?.id) return;

    try {
      const { error } = await (supabase as any)
        .from('rider_location_log')
        .insert({
          rider_id: user.id,
          lat: location.lat,
          lng: location.lng,
          speed_kmh: location.speed || 0,
          heading: location.heading || null,
          altitude_m: location.altitude || null,
          accuracy_m: location.accuracy || null,
          recorded_at: new Date(location.timestamp).toISOString(),
        });

      if (error) {
        console.error('Failed to log location:', error);
      }
    } catch (error) {
      console.error('Location logging error:', error);
    }
  }, [user?.id]);

  // Handle location update
  const handleLocationUpdate = useCallback((position: GeolocationPosition) => {
    const now = Date.now();
    const updateInterval = getUpdateInterval();

    // Throttle updates
    if (now - lastUpdateRef.current < updateInterval) {
      return;
    }

    const location: RiderLocation = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      speed: position.coords.speed ? position.coords.speed * 3.6 : null, // m/s to km/h
      heading: position.coords.heading ? `${position.coords.heading}°` : null,
      altitude: position.coords.altitude || null,
      timestamp: position.timestamp,
    };

    setCurrentLocation(location);
    lastLocationRef.current = location;
    lastUpdateRef.current = now;

    // Log to database
    logLocation(location);
  }, [getUpdateInterval, setCurrentLocation, logLocation]);

  // Handle location error
  const handleLocationError = useCallback((error: GeolocationPositionError) => {
    console.error('Location tracking error:', error);

    // Update status with error
    updateStatus({
      networkStrength: 'none',
    });
  }, [updateStatus]);

  // Start location tracking
  const startTracking = useCallback((options: LocationOptions = {}) => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported');
      return false;
    }

    const defaultOptions: PositionOptions = {
      enableHighAccuracy: options.enableHighAccuracy ?? true,
      timeout: options.timeout ?? 10000,
      maximumAge: options.maximumAge ?? 30000,
    };

    try {
      const watchId = navigator.geolocation.watchPosition(
        handleLocationUpdate,
        handleLocationError,
        defaultOptions
      );

      watchIdRef.current = watchId;
      setLocationTrackingEnabled(true);

      return true;
    } catch (error) {
      console.error('Failed to start location tracking:', error);
      return false;
    }
  }, [handleLocationUpdate, handleLocationError, setLocationTrackingEnabled]);

  // Stop location tracking
  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setLocationTrackingEnabled(false);
  }, [setLocationTrackingEnabled]);

  // Get current position once
  const getCurrentPosition = useCallback((options: LocationOptions = {}): Promise<RiderLocation> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const defaultOptions: PositionOptions = {
        enableHighAccuracy: options.enableHighAccuracy ?? true,
        timeout: options.timeout ?? 10000,
        maximumAge: options.maximumAge ?? 0,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: RiderLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            speed: position.coords.speed ? position.coords.speed * 3.6 : null,
            heading: position.coords.heading ? `${position.coords.heading}°` : null,
            altitude: position.coords.altitude || null,
            timestamp: position.timestamp,
          };
          resolve(location);
        },
        (error) => {
          reject(error);
        },
        defaultOptions
      );
    });
  }, []);

  // Auto-start/stop based on online status
  useEffect(() => {
    if (status?.online && !isLocationTrackingEnabled) {
      startTracking();
    } else if (!status?.online && isLocationTrackingEnabled) {
      stopTracking();
    }
  }, [status?.online, isLocationTrackingEnabled, startTracking, stopTracking]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracking();
    };
  }, [stopTracking]);

  return {
    currentLocation,
    isTracking: isLocationTrackingEnabled,
    startTracking,
    stopTracking,
    getCurrentPosition,
  };
};
