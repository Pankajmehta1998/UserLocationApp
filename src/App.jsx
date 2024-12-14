import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

const OSRM_API_URL = 'https://router.project-osrm.org/route/v1/driving/';

const App = () => {
  const [startLocation, setStartLocation] = useState({
    latitude: 28.6139, // New Delhi coordinates
    longitude: 77.2090,
  });
  const [endLocation, setEndLocation] = useState({
    latitude: 28.4595, // Gurugram coordinates
    longitude: 77.0266,
  });
  const [routeCoordinates, setRouteCoordinates] = useState([]);

  // Function to fetch route from OSRM API
  const fetchRoute = async () => {
    try {
      const response = await fetch(
        `${OSRM_API_URL}${startLocation.longitude},${startLocation.latitude};${endLocation.longitude},${endLocation.latitude}?overview=full&geometries=geojson`
      );
      const data = await response.json();
      if (data?.routes && data?.routes?.length > 0) {
        const route = data?.routes[0]?.geometry?.coordinates;
        const formattedRoute = route?.map((point) => ({
          latitude: point[1],
          longitude: point[0],
        }));
        setRouteCoordinates(formattedRoute);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  // Fetch route on initial load and every 10 minutes
  useEffect(() => {
    fetchRoute();

    const intervalId = setInterval(() => {
      fetchRoute();
    }, 600000);

    // Cleanup the interval on component unmount
    return () => clearInterval(intervalId);
  }, [startLocation, endLocation]);

  // Optional: Update start and end location after every 10 minutes
  useEffect(() => {
    const locationInterval = setInterval(() => {
      setStartLocation({
        latitude: 28.6139 + (Math.random() - 0.5) * 0.01,
        longitude: 77.2090 + (Math.random() - 0.5) * 0.01,
      });
      setEndLocation({
        latitude: 28.4595 + (Math.random() - 0.5) * 0.01,
        longitude: 77.0266 + (Math.random() - 0.5) * 0.01,
      });
    }, 600000);

    // Cleanup interval on component unmount
    return () => clearInterval(locationInterval);
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: (startLocation?.latitude + endLocation?.latitude) / 2,
          longitude: (startLocation?.longitude + endLocation?.longitude) / 2,
          latitudeDelta: Math.abs(startLocation?.latitude - endLocation?.latitude) + 0.1,
          longitudeDelta: Math.abs(startLocation?.longitude - endLocation?.longitude) + 0.1,
        }}
      >
        {/* Marker for Start Location */}
        <Marker coordinate={startLocation} title="Start: New Delhi" />
        
        {/* Marker for End Location */}
        <Marker coordinate={endLocation} title="End: Gurugram" />

        {/* Polyline for Route */}
        {routeCoordinates?.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor="red"
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
});

export default App;

