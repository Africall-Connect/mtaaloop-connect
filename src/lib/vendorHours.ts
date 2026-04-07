/**
 * Determines if a vendor is currently open based on their open_hours string.
 * Expected format: "HH:MM-HH:MM" (24h), e.g. "06:00-17:00"
 * Falls back to the static is_open field if open_hours is missing/unparseable.
 */
export function isVendorCurrentlyOpen(
  openHours: string | null | undefined,
  isOpenFallback: boolean
): boolean {
  if (!openHours) return isOpenFallback;

  const match = openHours.match(/^(\d{1,2}):(\d{2})\s*-\s*(\d{1,2}):(\d{2})$/);
  if (!match) return isOpenFallback;

  const openH = parseInt(match[1], 10);
  const openM = parseInt(match[2], 10);
  const closeH = parseInt(match[3], 10);
  const closeM = parseInt(match[4], 10);

  // Get current time in EAT (UTC+3)
  const now = new Date();
  const eatOffset = 3 * 60; // minutes
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const eatMinutes = (utcMinutes + eatOffset) % (24 * 60);

  const openAt = openH * 60 + openM;
  const closeAt = closeH * 60 + closeM;

  if (closeAt > openAt) {
    // Normal range, e.g. 06:00-17:00
    return eatMinutes >= openAt && eatMinutes < closeAt;
  } else {
    // Overnight range, e.g. 22:00-06:00
    return eatMinutes >= openAt || eatMinutes < closeAt;
  }
}
