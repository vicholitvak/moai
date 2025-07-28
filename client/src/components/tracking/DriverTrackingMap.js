import React, { useState, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase-config'; // Make sure this path is correct

const containerStyle = {
  width: '100%',
  height: '400px'
};

// A default center for the map, e.g., a central city location
const defaultCenter = {
  lat: 34.052235,
  lng: -118.243683
};

const DriverTrackingMap = ({ driverId }) => {
  const [driverPosition, setDriverPosition] = useState(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: "YOUR_GOOGLE_MAPS_API_KEY" // IMPORTANT: Replace with your key
  });

  useEffect(() => {
    if (!driverId) return;

    const driverLocationRef = doc(db, 'driverLocations', driverId);

    // Set up a real-time listener for the driver's location
    const unsubscribe = onSnapshot(driverLocationRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.position) {
          setDriverPosition(data.position);
        }
      } else {
        console.log("No location data for this driver.");
        // Optionally handle the case where the driver isn't being tracked
      }
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [driverId]);

  if (!isLoaded) {
    return <div>Loading Map...</div>;
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={driverPosition || defaultCenter}
      zoom={15}
    >
      {driverPosition && (
        <Marker
          position={driverPosition}
          // You can use a custom icon for the driver
          // icon={'/path/to/driver-icon.png'}
        />
      )}
    </GoogleMap>
  );
};

export default DriverTrackingMap;