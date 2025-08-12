import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import { Maps_API_KEY } from '../constants/AppData';
import GooglePlacesInput from './AdressInput';
import LocationPicker from './LocationPicker';

type Address = {
  street?: string;
  city?: string;
  country?: string;
  state?: string;
  postalCode?: string;
  apartment?: string;
  latitude?: number;
  longitude?: number;
};

interface AddressFormProps {
  onAddressChange?: (address: Address) => void;
}

export const AddressForm: React.FC<AddressFormProps> = ({ onAddressChange }) => {
  const [address, setAddress] = useState<Address>({});
  const [countryCode, setCountryCode] = useState<CountryCode>('US');
  const [country, setCountry] = useState<Country | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapSelectedAddress, setMapSelectedAddress] = useState<string>('');

  const handleCountrySelect = (country: Country) => {
    
    setCountryCode(country.cca2);
    setCountry(country);
    const updatedAddress = { ...address, country: country.name as string };
    setAddress(updatedAddress);
    onAddressChange?.(updatedAddress);
  };
  type GpsLocation = {
    latitude: number;
    longitude: number;
  };
  
  /**
   * Adds random GPS noise (within ±100m) to the original location.
   */
  function addGpsNoise(
    location: GpsLocation,
    maxOffsetMeters = 100
  ): GpsLocation {
    const earthRadius = 6371000; // meters
    const offsetLat = (Math.random() - 0.5) * 2 * (maxOffsetMeters / earthRadius) * (180 / Math.PI);
    const offsetLng = (Math.random() - 0.5) * 2 * (maxOffsetMeters / earthRadius) * (180 / Math.PI) / Math.cos(location.latitude * Math.PI / 180);
  
    return {
      latitude: location.latitude + offsetLat,
      longitude: location.longitude + offsetLng,
    };
  }
  

  const handleMapLocationSelect = (location: { latitude: number; longitude: number; address?: string }) => {
    console.log("Map location selected:", location);
    
    // Add GPS noise to the location (within ±100m)
    const noisyLocation = addGpsNoise(
      { latitude: location.latitude, longitude: location.longitude },
      100
    );
    
    console.log("Noisy GPS from map:", noisyLocation);
    
    const updatedAddress: Address = {
      ...address,
      latitude: noisyLocation.latitude,
      longitude: noisyLocation.longitude,
    };
    
    // If we have address information from reverse geocoding, try to parse it
    if (location.address) {
      const addressParts = location.address.split(', ');
      if (addressParts.length >= 3) {
        updatedAddress.street = addressParts[0];
        updatedAddress.city = addressParts[1];
        updatedAddress.country = addressParts[addressParts.length - 1];
      }
      
      // Set the address to fill the input field
      setMapSelectedAddress(location.address);
    }
    
    setAddress(updatedAddress);
    onAddressChange?.(updatedAddress);
    setShowMapPicker(false);
  };

  const handleLocationSelect = (location: { latitude: number; longitude: number; address: string; address_components?: any[] }) => {
    console.log("Original location:", location);
    
    // Add GPS noise to the location (within ±100m)
    const noisyLocation = addGpsNoise(
      { latitude: location.latitude, longitude: location.longitude },
      100
    );
    
    console.log("Noisy GPS:", noisyLocation);
    
    // Initialize address components
    let streetNumber = "";
    let route = "";
    let locality = "";
    let administrativeArea = "";
    let country = "";
    let postalCode = "";
    
    // Parse address components if available (Google Places API)
    if (location.address_components) {
      for (const component of location.address_components) {
        const componentType = component.types[0];
        
        switch (componentType) {
          case "street_number": {
            streetNumber = component.long_name;
            break;
          }
          case "route": {
            route = component.short_name;
            break;
          }
          case "postal_code": {
            postalCode = component.long_name;
            break;
          }
          case "postal_code_suffix": {
            postalCode = `${postalCode}-${component.long_name}`;
            break;
          }
          case "locality": {
            locality = component.long_name;
            break;
          }
          case "administrative_area_level_1": {
            administrativeArea = component.short_name;
            break;
          }
          case "country": {
            country = component.long_name;
            break;
          }
        }
      }
    }
    
    // Build street address
    const streetAddress = streetNumber && route ? `${streetNumber} ${route}` : location.address.split(', ')[0] || '';
    
    // Fallback to simple parsing if no address_components
    if (!location.address_components) {
      const addressParts = location.address.split(', ');
      locality = addressParts[1] || '';
      country = addressParts[addressParts.length - 1] || '';
    }
    
    const updatedAddress: Address = {
      ...address,
      latitude: noisyLocation.latitude,
      longitude: noisyLocation.longitude,
      street: streetAddress,
      city: locality,
      state: administrativeArea,
      country: country,
      postalCode: postalCode,
    };
    
    console.log("Parsed address components:", updatedAddress);
    setAddress(updatedAddress);
    onAddressChange?.(updatedAddress);
  };

  return (
    <View style={styles.container}>
      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Fill in your address</Text>
        <GooglePlacesInput 
          selectedCountry={address.country}
          selectedCountryCode={country?.cca2}
          setCountry={(country) => {
            const updatedAddress = { ...address, country };
            setAddress(updatedAddress);
            onAddressChange?.(updatedAddress);
          }}
          onLocationSelect={handleLocationSelect}
          initialAddress={mapSelectedAddress}
        />
      </View>

      <View style={styles.fieldContainer}>
        <Text style={styles.label}>Or pick location on map</Text>
        <TouchableOpacity 
          style={styles.mapButton}
          onPress={() => {
            console.log('Map button pressed, current state:', showMapPicker);
            setShowMapPicker(true);
          }}
        >
          <Text style={styles.mapButtonText}>
            📍 Pick Location on Map
          </Text>
        </TouchableOpacity>
      </View>

      {/* Map Picker Modal */}
      <Modal
        visible={showMapPicker}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowMapPicker(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => setShowMapPicker(false)}
            >
              <Text style={styles.closeModalButtonText}>✕ Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Location</Text>
            <View style={styles.placeholder} />
          </View>
          
          <LocationPicker
            onLocationSelect={handleMapLocationSelect}
            initialLocation={address.latitude && address.longitude ? 
              { latitude: address.latitude, longitude: address.longitude } : undefined
            }
          />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { padding: 16 },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  requiredNote: {
    fontSize: 12,
    color: '#666',
    marginBottom: 20,
  },
  fieldContainer: { marginBottom: 20,
    gap: 15
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfWidth: {
    width: '48%',
  },
  label: { 
    marginBottom: 8, 
    fontWeight: 'bold', 
    fontSize: 16,
    color: '#333'
  },
  countryPickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  countryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 0,
  },
  countryButtonText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  input: { 
    borderColor: '#ddd', 
    borderWidth: 1, 
    borderRadius: 8, 
    padding: 12,
    backgroundColor: 'white',
    fontSize: 16,
  },
  filledInput: {
    borderColor: '#4caf50',
    backgroundColor: '#f8fff8',
  },
  emptyInput: {
    borderColor: '#007AFF',
  },
  locationSummary: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#4caf50',
  },
  locationSummaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 5,
  },
  locationSummaryText: {
    fontSize: 14,
    color: '#2e7d32',
    lineHeight: 20,
  },
  coordinatesText: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
    fontFamily: 'monospace',
  },
  saveButton: {
    backgroundColor: '#000',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  mapButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  mapButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  mapPickerContainer: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 10,
  },
  debugText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  closeModalButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  closeModalButtonText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  placeholder: {
    width: 60,
  },
}); 