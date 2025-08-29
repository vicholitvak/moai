import React, { useEffect, useState, useRef } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/client';

interface Driver {
  id: string;
  displayName: string;
  currentLocation: { lat: number; lng: number };
  isOnline: boolean;
  hasActiveDelivery: boolean;
  vehicleType?: string;
  rating?: number;
}

interface GoogleDriversMapProps {
  showOnlyActiveDeliveries: boolean;
}

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const GoogleDriversMap: React.FC<GoogleDriversMapProps> = ({ showOnlyActiveDeliveries }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || map) return;
    const loader = new Loader({ apiKey: GOOGLE_MAPS_API_KEY!, version: 'weekly' });
    loader.load().then(() => {
      const gMap = new google.maps.Map(mapRef.current!, {
        center: { lat: -22.9087, lng: -68.1997 }, // San Pedro de Atacama
        zoom: 12,
      });
      setMap(gMap);
    });
  }, [mapRef, map]);

  useEffect(() => {
    // Listen to all drivers in Firestore
    const q = query(collection(db, 'drivers'), where('isOnline', '==', true));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allDrivers: Driver[] = [];
      snapshot.forEach(doc => {
        const data = doc.data();
        if (!data.currentLocation) return;
        allDrivers.push({
          id: doc.id,
          displayName: data.displayName || 'Sin nombre',
          currentLocation: data.currentLocation,
          isOnline: data.isOnline,
          hasActiveDelivery: !!data.activeOrderId,
          vehicleType: data.vehicleType,
          rating: data.rating,
        });
      });
      setDrivers(allDrivers);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!map) return;
    // Remove old markers
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    // Filter drivers
    const filtered = showOnlyActiveDeliveries
      ? drivers.filter(d => d.hasActiveDelivery)
      : drivers;
    filtered.forEach(driver => {
      const marker = new google.maps.Marker({
        position: driver.currentLocation,
        map,
        label: driver.displayName[0] || 'D',
        title: `${driver.displayName} (${driver.vehicleType || ''})`,
        icon: {
          url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png',
        },
      });
      const info = new google.maps.InfoWindow({
        content: `<div><strong>${driver.displayName}</strong><br/>${driver.vehicleType || ''}<br/>${driver.rating ? '⭐ ' + driver.rating : ''}</div>`
      });
      marker.addListener('click', () => info.open(map, marker));
      markersRef.current.push(marker);
    });
  }, [map, drivers, showOnlyActiveDeliveries]);

  return (
    <div ref={mapRef} style={{ width: '100%', height: 480, borderRadius: 12, overflow: 'hidden' }} />
  );
};

export default GoogleDriversMap;
