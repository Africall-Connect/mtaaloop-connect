import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface RiderStatus {
  online: boolean;
  lastOnlineAt: string | null;
  activeTimeSeconds: number;
  batteryPct: number | null;
  networkStrength: 'none' | 'weak' | 'fair' | 'good' | 'excellent' | null;
  storageFreeMb: number | null;
}

export interface RiderLocation {
  lat: number;
  lng: number;
  accuracy: number | null;
  speed: number | null;
  heading: string | null;
  altitude: number | null;
  timestamp: number;
}

export interface ActiveDelivery {
  id: string;
  publicId: string;
  status: string;
  pickupAddress: string;
  dropoffAddress: string;
  pickupLat?: number;
  pickupLng?: number;
  dropoffLat?: number;
  dropoffLng?: number;
  valueKes: number;
  distanceKm?: number;
  pickupCode?: string;
  deliveryCode?: string;
  acceptedAt?: string;
  pickedAt?: string;
  deliveredAt?: string;
}

interface RiderStore {
  // Status
  status: RiderStatus | null;
  setStatus: (status: RiderStatus | null) => void;
  updateStatus: (updates: Partial<RiderStatus>) => void;

  // Location
  currentLocation: RiderLocation | null;
  setCurrentLocation: (location: RiderLocation | null) => void;

  // Active delivery
  activeDelivery: ActiveDelivery | null;
  setActiveDelivery: (delivery: ActiveDelivery | null) => void;

  // Live metrics
  todaysEarnings: number;
  todaysDeliveries: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  setTodaysEarnings: (amount: number) => void;
  setTodaysDeliveries: (count: number) => void;
  setWeeklyEarnings: (amount: number) => void;
  setMonthlyEarnings: (amount: number) => void;

  // UI state
  isLocationTrackingEnabled: boolean;
  setLocationTrackingEnabled: (enabled: boolean) => void;

  // Reset
  reset: () => void;
}

const initialState = {
  status: null,
  currentLocation: null,
  activeDelivery: null,
  todaysEarnings: 0,
  todaysDeliveries: 0,
  weeklyEarnings: 0,
  monthlyEarnings: 0,
  isLocationTrackingEnabled: false,
};

export const useRiderStore = create<RiderStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setStatus: (status) => set({ status }),

      updateStatus: (updates) => {
        const currentStatus = get().status;
        if (currentStatus) {
          set({ status: { ...currentStatus, ...updates } });
        }
      },

      setCurrentLocation: (location) => set({ currentLocation: location }),

      setActiveDelivery: (delivery) => set({ activeDelivery: delivery }),

      setTodaysEarnings: (amount) => set({ todaysEarnings: amount }),
      setTodaysDeliveries: (count) => set({ todaysDeliveries: count }),
      setWeeklyEarnings: (amount) => set({ weeklyEarnings: amount }),
      setMonthlyEarnings: (amount) => set({ monthlyEarnings: amount }),

      setLocationTrackingEnabled: (enabled) => set({ isLocationTrackingEnabled: enabled }),

      reset: () => set(initialState),
    }),
    {
      name: 'rider-store',
    }
  )
);
