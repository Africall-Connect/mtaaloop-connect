// Utility functions for vendor calculations

export function isVendorOpen(hours?: string): boolean {
  // Simple implementation - can be enhanced later
  return true;
}

export function calculateAverageRating(ratings?: number[]): number {
  if (!ratings || ratings.length === 0) return 0;
  const sum = ratings.reduce((acc, r) => acc + r, 0);
  return sum / ratings.length;
}

export function calculateDeliveryFee(distance: number): number {
  // Base fee + distance-based fee
  // $2 base + $0.5 per km
  return Math.round((2 + distance * 0.5) * 100) / 100;
}

export function calculateDeliveryTime(distance: number): string {
  // Estimate: 5 min base + 2 min per km
  const minutes = Math.ceil(5 + distance * 2);
  return `${minutes}-${minutes + 10} mins`;
}

export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  // Haversine formula for distance calculation
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100; // Distance in km, rounded to 2 decimals
}
