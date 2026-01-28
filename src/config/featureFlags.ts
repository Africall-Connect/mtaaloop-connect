export const featureFlags = {
  zoneHeatmap: true,
  earningsGoals: true,
  mpesaWithdrawals: true,
  referralProgram: true,
  achievementsBadges: true,
  backgroundLocation: true,
  pwaInstall: true,
} as const;

export type FeatureFlags = typeof featureFlags;
