import { Platform } from 'react-native';
import * as Location from 'expo-location';

export type RealGPSData = {
  latitude: number;
  longitude: number;
  accuracy: number | null;
  altitude: number | null;
  address: string;
  gpsFormatted: string;
  mapsUrl: string;
};

export function formatCoordinates(lat: number, lng: number, accuracy?: number | null): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  const accStr = accuracy != null ? ` (±${Math.round(accuracy)}m)` : '';
  return `${Math.abs(lat).toFixed(6)}° ${latDir}, ${Math.abs(lng).toFixed(6)}° ${lngDir}${accStr}`;
}

export function getGoogleMapsUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

export async function resolvePlaceName(lat: number, lng: number): Promise<string | null> {
  try {
    if (Platform.OS !== 'web') {
      const geo = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      const g = geo?.[0];
      if (g) {
        const parts = [
          g.name,
          g.streetNumber ? `${g.streetNumber} ${g.street || ''}`.trim() : g.street,
          g.district || g.subregion,
          g.city,
          g.region,
          g.postalCode,
          g.country,
        ].filter(Boolean);
        const name = parts.join(', ');
        if (name) return name;
      }
    }

    // OpenStreetMap reverse geocoding fallback
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18`,
      { headers: { 'User-Agent': 'KwOrKs-App/1.0' } }
    );
    if (res.ok) {
      const data = await res.json();
      if (typeof data?.display_name === 'string' && data.display_name.length > 0) {
        return data.display_name;
      }
      const a = data?.address ?? {};
      const parts = [
        a.road ?? a.building ?? a.house_number,
        a.suburb ?? a.neighbourhood,
        a.city ?? a.town ?? a.village ?? a.county,
        a.state,
        a.postcode,
        a.country,
      ].filter(Boolean);
      const joined = parts.join(', ');
      if (joined) return joined;
    }
  } catch {}

  return null;
}

export async function getRealGPSLocation(): Promise<RealGPSData | null> {
  try {
    const { granted } = await Location.requestForegroundPermissionsAsync();
    if (!granted) return null;

    const pos = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Highest,
    });

    const lat = pos.coords.latitude;
    const lng = pos.coords.longitude;
    const accuracy = pos.coords.accuracy ?? null;
    const altitude = pos.coords.altitude ?? null;

    const resolved = await resolvePlaceName(lat, lng);
    const address = resolved || `${lat.toFixed(5)}°, ${lng.toFixed(5)}°`;
    const gpsFormatted = formatCoordinates(lat, lng, accuracy);
    const mapsUrl = getGoogleMapsUrl(lat, lng);

    return {
      latitude: lat,
      longitude: lng,
      accuracy,
      altitude,
      address,
      gpsFormatted,
      mapsUrl,
    };
  } catch {
    return null;
  }
}