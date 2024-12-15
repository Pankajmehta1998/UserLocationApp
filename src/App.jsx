import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';

const OSRM_API_URL = 'https://router.project-osrm.org/route/v1/driving/';

const App = () => {
  const [startLocation, setStartLocation] = useState({
    latitude: 28.6139,
    longitude: 77.2090,
  });
  const [endLocation, setEndLocation] = useState({
    latitude: 28.4595,
    longitude: 77.0266,
  });
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [arrowPositions, setArrowPositions] = useState([]);

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
        calculateArrowPositions(formattedRoute);
      }
    } catch (error) {
      console.error('Error fetching route:', error);
    }
  };

  const calculateArrowPositions = (coordinates) => {
    const positions = [];
    const desiredArrowSpacing = 2500; // Spacing between arrows in meters
    let currentDistance = 0;
    const offset = 0.0001;

    for (let i = 0; i < coordinates?.length - 1; i++) {
      const { latitude: lat1, longitude: lon1 } = coordinates[i];
      const { latitude: lat2, longitude: lon2 } = coordinates[i + 1];
      const distance = calculateDistance(lat1, lon1, lat2, lon2);
      currentDistance += distance;

      if (currentDistance >= desiredArrowSpacing) {
        const midpoint = {
          latitude: (lat1 + lat2) / 2,
          longitude: (lon1 + lon2) / 2,
        };
        positions.push({
          latitude: midpoint.latitude + offset,
          longitude: midpoint.longitude,
        });
        currentDistance = 0;
      }
    }

    const lastCoord = coordinates[coordinates.length - 1];
    positions.push({
      latitude: lastCoord.latitude + offset,
      longitude: lastCoord.longitude,
    });

    setArrowPositions(positions);
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c * 1000; // Convert to meters
  };

  useEffect(() => {
    fetchRoute();
    const intervalId = setInterval(() => {
      fetchRoute();
    }, 600000); // Update the route every 10 minutes
    return () => clearInterval(intervalId);
  }, [startLocation, endLocation]);

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
    }, 600000); // for Updating users locations every 10 minutes
    return () => clearInterval(locationInterval);
  }, []);

  const calculateArrowRotation = (coordinates, index) => {
    if (index === 0 || index === coordinates.length - 1) {
      // for first and last arrows
      const [firstCoord, secondCoord] = [
        coordinates[0],
        coordinates[1],
      ];
      const [secondLastCoord, lastCoord] = [
        coordinates[coordinates.length - 2],
        coordinates[coordinates.length - 1],
      ];

      if (index === 0) {
        // First arrow
        return Math.atan2(
          secondCoord.latitude - firstCoord.latitude,
          secondCoord.longitude - firstCoord.longitude
        ) * (360 / Math.PI);
      } else {
        // Last arrow
        return Math.atan2(
          lastCoord.latitude - secondLastCoord.latitude,
          lastCoord.longitude - secondLastCoord.longitude
        ) * (360 / Math.PI);
      }
    } else {
      // For all other arrows
      const prevCoord = coordinates[index - 1];
      const currCoord = coordinates[index];
      return Math.atan2(
        currCoord.latitude - prevCoord.latitude,
        currCoord.longitude - prevCoord.longitude
      ) * (360 / Math.PI);
    }
  };
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
        <Marker coordinate={startLocation} title="Start: New Delhi" />
        <Marker coordinate={endLocation} title="End: Gurugram" />

        {routeCoordinates?.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeWidth={4}
            strokeColor="red"
            lineCap="round"
            lineJoin="round"
            geodesic={true}
          />
        )}

        {arrowPositions.map((position, index) => (
          <Marker
            key={`arrow-${index}`}
            coordinate={position}
            anchor={{ x: 0.5, y: 0.5 }}
            rotation={calculateArrowRotation(routeCoordinates, index)}
          >
            <Image
              source={require('./assets/images/pngtree-red-arrow-irregular-triangle-unidirectional-linear-shape-png-image_4362204.png')}
              style={{ width: 30, height: 20 }}
            />
          </Marker>
        ))}
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
