import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { origin, destination, mode = 'driving' } = await request.json();
    
    if (!origin || !destination) {
      return NextResponse.json(
        { error: 'Origin and destination are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Google Maps API key not configured' },
        { status: 500 }
      );
    }

    // Call Google Maps Directions API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/directions/json?` +
      `origin=${encodeURIComponent(origin)}&` +
      `destination=${encodeURIComponent(destination)}&` +
      `mode=${mode}&` +
      `key=${apiKey}&` +
      `traffic_model=best_guess&` +
      `departure_time=now&` +
      `units=metric`
    );

    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.status !== 'OK') {
      return NextResponse.json(
        { error: `Google Maps API error: ${data.status}` },
        { status: 400 }
      );
    }

    // Extract useful information
    const route = data.routes[0];
    const leg = route.legs[0];
    
    const result = {
      routes: data.routes,
      distance: leg.distance.text,
      duration: leg.duration.text,
      durationValue: leg.duration.value, // in seconds
      polyline: route.overview_polyline.points,
      estimatedArrival: new Date(Date.now() + leg.duration.value * 1000)
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error fetching directions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch directions' },
      { status: 500 }
    );
  }
}