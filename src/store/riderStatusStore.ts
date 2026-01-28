import { create } from "zustand";

type RiderStatusState = {
  online: boolean;
  lastOnlineAt: string | null;
  setStatus: (online: boolean, lastOnlineAt?: string | null) => void;
};

export const useRiderStatusStore = create<RiderStatusState>((set) => ({
  online: false,
  lastOnlineAt: null,
  setStatus: (online, lastOnlineAt = null) =>
    set({ online, lastOnlineAt }),
}));
