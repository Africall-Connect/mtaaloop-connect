import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface Apartment {
  id: string;
  name: string;
  phase?: number;
  unitCount: number;
  hasPhases: boolean;
  phaseCount?: number;
  house_name?: string;
}

interface ApartmentContextType {
  currentApartment: Apartment | null;
  setCurrentApartment: (apartment: Apartment) => void;
}

const ApartmentContext = createContext<ApartmentContextType | undefined>(undefined);

const DEFAULT_APARTMENT: Apartment = {
  id: "royal-suburbs-phase-2",
  name: "Royal Suburbs by Tsavo",
  phase: 2,
  unitCount: 500,
  hasPhases: true,
  phaseCount: 4,
};

export function ApartmentProvider({ children }: { children: ReactNode }) {
  const [currentApartment, setCurrentApartmentState] = useState<Apartment | null>(null);

  // Load apartment from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("mtaalopp_apartment");
    if (stored) {
      try {
        setCurrentApartmentState(JSON.parse(stored));
      } catch {
        setCurrentApartmentState(DEFAULT_APARTMENT);
      }
    } else {
      setCurrentApartmentState(DEFAULT_APARTMENT);
    }
  }, []);

  // Save apartment to localStorage whenever it changes
  const setCurrentApartment = useCallback((apartment: Apartment) => {
    console.log("🏢 Setting apartment in context:", apartment);
    setCurrentApartmentState(apartment);
    localStorage.setItem("mtaalopp_apartment", JSON.stringify(apartment));
    console.log("✅ Apartment saved to localStorage");
  }, []);

  const value = { currentApartment, setCurrentApartment };

  return (
    <ApartmentContext.Provider value={value}>
      {children}
    </ApartmentContext.Provider>
  );
}

export function useApartment() {
  const context = useContext(ApartmentContext);
  if (context === undefined) {
    throw new Error("useApartment must be used within an ApartmentProvider");
  }
  return context;
}
