
import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface PuzzleCompletion {
  eventType: string;
  playerAlias: string;
  badge: string;
  completedAt: Date;
  isEarlyBird: boolean;
  bonusAnswer?: string;
  selectedPreference?: string;
}

interface GamificationContextType {
  completedPuzzles: PuzzleCompletion[];
  addCompletion: (completion: PuzzleCompletion) => void;
  generatePlayerAlias: () => string;
  getRandomBadge: () => string;
  checkEarlyBird: (startTime: Date) => boolean;
}

const GamificationContext = createContext<GamificationContextType | undefined>(undefined);

export const useGamification = () => {
  const context = useContext(GamificationContext);
  if (!context) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
};

export const GamificationProvider = ({ children }: { children: ReactNode }) => {
  const [completedPuzzles, setCompletedPuzzles] = useState<PuzzleCompletion[]>([]);

  const generatePlayerAlias = (): string => {
    const prefixes = ['Vibe', 'Chill', 'Beat', 'Quest', 'Trail', 'Cinema'];
    const suffixes = ['Ranger', 'Hunter', 'Master', 'Explorer', 'Seeker', 'Player'];
    const randomNum = Math.floor(Math.random() * 999) + 1;
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    return `${prefix}${suffix}${randomNum.toString().padStart(3, '0')}`;
  };

  const getRandomBadge = (): string => {
    const badges = ['🌀', '💠', '✶', '🎭', '🎵', '🎬', '🏕️', '⭐', '🔥', '💎'];
    return badges[Math.floor(Math.random() * badges.length)];
  };

  const checkEarlyBird = (startTime: Date): boolean => {
    const now = new Date();
    const timeDiff = now.getTime() - startTime.getTime();
    return timeDiff <= 30 * 60 * 1000; // 30 minutes in milliseconds
  };

  const addCompletion = (completion: PuzzleCompletion) => {
    setCompletedPuzzles(prev => [...prev, completion]);
  };

  return (
    <GamificationContext.Provider
      value={{
        completedPuzzles,
        addCompletion,
        generatePlayerAlias,
        getRandomBadge,
        checkEarlyBird,
      }}
    >
      {children}
    </GamificationContext.Provider>
  );
};
