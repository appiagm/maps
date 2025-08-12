import React, { useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, LatLng } from 'react-native-maps';
import * as Location from 'expo-location';

interface LocationPickerProps {
  onLocationSelect?: (location: { latitude: number; longitude: number; address?: string }) => void;
  initialLocation?: { latitude: number; longitude: number };
}

export default function LocationPicker({ onLocationSelect, initialLocation }: LocationPickerProps) {
  const [selectedLocation, setSelectedLocation] = useState<LatLng | null>(
    initialLocation ? { latitude: initialLocation.latitude, longitude: initialLocation.longitude } : null
  );
  const [addressInfo, setAddressInfo] = useState<string>('');

  const handleMapPress = async (event: any) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    const newLocation = { latitude, longitude };
    setSelectedLocation(newLocation);
    
    // Try to get address information
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });
      
      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const addressString = [
          address.street,
          address.city,
          address.region,
          address.country
        ].filter(Boolean).join(', ');
        setAddressInfo(addressString);
        onLocationSelect?.({ ...newLocation, address: addressString });
      } else {
        setAddressInfo('');
        onLocationSelect?.(newLocation);
      }
    } catch (error) {
      console.log('Reverse geocoding failed:', error);
      setAddressInfo('');
      onLocationSelect?.(newLocation);
    }
  };

  const getInitialRegion = () => {
    if (selectedLocation) {
      return {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }
    
    // Default to a central location (you can change this)
    return {
      latitude: 36.8065,
      longitude: 10.1815,
      latitudeDelta: 0.05,
      longitudeDelta: 0.05,
    };
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerSection}>
        <Text style={styles.title}>Select Location on Map</Text>
        <Text style={styles.subtitle}>Tap on the map to drop a pin</Text>
        
        <TouchableOpacity 
          style={styles.currentLocationButton}
          onPress={async () => {
            try {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status === 'granted') {
                const location = await Location.getCurrentPositionAsync({});
                const newLocation = { 
                  latitude: location.coords.latitude, 
                  longitude: location.coords.longitude 
                };
                setSelectedLocation(newLocation);
                handleMapPress({ nativeEvent: { coordinate: newLocation } });
              }
            } catch (error) {
              console.log('Error getting current location:', error);
            }
          }}
        >
          <Text style={styles.currentLocationButtonText}>📍 Use Current Location</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={getInitialRegion()}
          onPress={handleMapPress}
          showsUserLocation={true}
          showsMyLocationButton={true}
        >
          {selectedLocation && (
            <Marker 
              coordinate={selectedLocation}
              pinColor="#007AFF"
              title="Selected Location"
              description="Tap to confirm this location"
            />
          )}
        </MapView>
      </View>
      
      {selectedLocation && (
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            Selected: {selectedLocation.latitude.toFixed(6)}, {selectedLocation.longitude.toFixed(6)}
          </Text>
          {addressInfo && (
            <Text style={styles.addressText}>
              Address: {addressInfo}
            </Text>
          )}
          <Text style={styles.helpText}>
            Tap anywhere else on the map to change the location
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  mapContainer: {
    flex: 1,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  map: {
    flex: 1,
  },
  locationInfo: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  locationText: {
    fontSize: 14,
    color: '#007AFF',
    fontFamily: 'monospace',
  },
  addressText: {
    fontSize: 13,
    color: '#333',
    marginTop: 4,
    fontStyle: 'normal',
  },
  helpText: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  currentLocationButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  currentLocationButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  headerSection: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
}); 