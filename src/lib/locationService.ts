// Location detection service for MtaaLoop
// Detects estate and neighborhood based on GPS coordinates

interface LocationResult {
  estate: string;
  neighborhood: string | null;
}

// Sample estates in Nairobi for demonstration
// In production, this would query a geo-spatial database or API
const KNOWN_ESTATES = [
  { name: 'Tsavo Apartments', lat: -1.2921, lng: 36.8219, neighborhood: 'Westlands' },
  { name: 'Garden Estate', lat: -1.2632, lng: 36.8091, neighborhood: 'Thome' },
  { name: 'Kileleshwa Heights', lat: -1.2886, lng: 36.7873, neighborhood: 'Kileleshwa' },
  { name: 'Parklands Plaza', lat: -1.2666, lng: 36.8233, neighborhood: 'Parklands' },
  { name: 'Kilimani View', lat: -1.2953, lng: 36.7809, neighborhood: 'Kilimani' },
  { name: 'Lavington Green', lat: -1.2837, lng: 36.7690, neighborhood: 'Lavington' },
  { name: 'South C Estate', lat: -1.3126, lng: 36.8258, neighborhood: 'South C' },
  { name: 'Eastleigh Square', lat: -1.2818, lng: 36.8408, neighborhood: 'Eastleigh' },
];

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLng = (lng2 - lng1) * (Math.PI / 180);
  
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
    Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

export async function detectLocation(latitude: number, longitude: number): Promise<LocationResult> {
  // Find the nearest estate
  let nearestEstate = KNOWN_ESTATES[0];
  let minDistance = calculateDistance(
    latitude,
    longitude,
    nearestEstate.lat,
    nearestEstate.lng
  );

  for (const estate of KNOWN_ESTATES) {
    const distance = calculateDistance(latitude, longitude, estate.lat, estate.lng);
    if (distance < minDistance) {
      minDistance = distance;
      nearestEstate = estate;
    }
  }

  // If distance is more than 5km, consider it as "Other Estate"
  if (minDistance > 5) {
    return {
      estate: 'Other Estate',
      neighborhood: 'Nairobi',
    };
  }

  return {
    estate: nearestEstate.name,
    neighborhood: nearestEstate.neighborhood,
  };
}
