'use server';

import { cache } from 'react';

interface LatLng {
  lat: number;
  lng: number;
}

export interface DirectionsResult {
  distanceText: string;
  distanceValue: number; // meters
  durationText: string;
  durationValue: number; // seconds
  polyline: string;
  endAddress: string;
  startAddress: string;
}

const DIRECTIONS_ENDPOINT = 'https://maps.googleapis.com/maps/api/directions/json';

export const getDirections = cache(async (
  origin: LatLng,
  destination: LatLng,
  waypoints: LatLng[] = []
): Promise<DirectionsResult | null> => {
  try {
    const serverKey = process.env.GOOGLE_MAPS_SERVER_KEY;
    if (!serverKey) {
      console.warn('GOOGLE_MAPS_SERVER_KEY is not configured. Directions API unavailable.');
      return null;
    }

    const params = new URLSearchParams({
      origin: `${origin.lat},${origin.lng}`,
      destination: `${destination.lat},${destination.lng}`,
      key: serverKey,
      language: 'es',
      region: 'cl'
    });

    if (waypoints.length > 0) {
      const waypointsParam = waypoints.map((point) => `${point.lat},${point.lng}`).join('|');
      params.append('waypoints', waypointsParam);
    }

    const response = await fetch(`${DIRECTIONS_ENDPOINT}?${params.toString()}`);

    if (!response.ok) {
      throw new Error(`Directions API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
      console.warn('No routes returned from Directions API', data.status, data.error_message);
      return null;
    }

    const route = data.routes[0];
    const leg = route.legs[0];

    return {
      distanceText: leg.distance.text,
      distanceValue: leg.distance.value,
      durationText: leg.duration.text,
      durationValue: leg.duration.value,
      polyline: route.overview_polyline.points,
      startAddress: leg.start_address,
      endAddress: leg.end_address
    };
  } catch (error) {
    console.error('Error fetching directions:', error);
    return null;
  }
});


