import React, { useState, useEffect } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, ActivityIndicator, TextInput, FlatList } from 'react-native';
import * as Location from 'expo-location';
import { useCachedPlaces } from '../hooks/useCachedPlaces';

interface GooglePlacesInputProps {
  selectedCountry?: string;
  selectedCountryCode?: string; // country code
  setCountry?: (country: string) => void;
  onLocationSelect?: (location: { latitude: number; longitude: number; address: string; address_components?: any[] }) => void;
  initialAddress?: string;
  customLocation?: { latitude: number; longitude: number };
}

const GooglePlacesInput: React.FC<GooglePlacesInputProps> = ({ 
  selectedCountry, 
  selectedCountryCode,
  setCountry, 
  onLocationSelect,
  initialAddress,
  customLocation
}) => {
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);

  const {
    results,
    isLoading,
    query,
    setQuery,
    searchPlaces,
    handlePlaceSelect,
    clearResults,
    clearResultsOnly
  } = useCachedPlaces({
    onLocationSelect: (loc) => {
      onLocationSelect?.(loc);
      if (setCountry) {
        const parts = loc.address.split(', ');
        const country = parts[parts.length - 1];
        setCountry(country);
      }
    },
    userLocation: customLocation || userLocation,
    countryCode: selectedCountryCode
  });

  // Set initial address if provided
  useEffect(() => {
    if (initialAddress) {
      setQuery(initialAddress);
    }
  }, [initialAddress, setQuery]);

  // Get user location when component mounts (only if no custom location is provided)
  useEffect(() => {
    if (!customLocation) {
      getUserLocation().catch(() => {});
    } else {
      setUserLocation(customLocation);
    }
  }, [customLocation]);

  const getUserLocation = async () => {
    try {
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      if (existingStatus !== 'granted') {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          return null;
        }
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        timeInterval: 10000,
      });

      const userLoc = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      };
      
      setUserLocation(userLoc);
      return userLoc;
    } catch (error) {
      return null;
    }
  };

  // Debounced search when query changes
  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      clearResultsOnly();
      return;
    }

    const timeoutId = setTimeout(() => {
      searchPlaces(trimmed);
    }, 600);

    return () => clearTimeout(timeoutId);
  }, [query, searchPlaces, clearResultsOnly]);

  const renderPlaceItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.placeItem}
      onPress={() => {
        setQuery(item.description);
        handlePlaceSelect(item);
        clearResultsOnly();
      }}
    >
      <Text style={styles.placeMainText}>{item.structured_formatting.main_text}</Text>
      <Text style={styles.placeSecondaryText}>{item.structured_formatting.secondary_text}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.autocompleteContainer}>
        <TextInput
          style={styles.textInput}
          placeholder='Search for area, streetname or landmark'
          placeholderTextColor='#666'
          value={query}
          onChangeText={setQuery}
        />
        {isLoading && (
          <ActivityIndicator 
            style={styles.loadingIndicator} 
            size='small' 
            color='#0066cc' 
          />
        )}
        {results.length > 0 && (
          <FlatList
            data={results}
            renderItem={renderPlaceItem}
            keyExtractor={(item) => item.place_id}
            style={styles.listView}
            keyboardShouldPersistTaps='handled'
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: 'transparent',
    zIndex: 9998,
    elevation: 9998,
  },
  autocompleteContainer: {
    flex: 1,
  },
  textInput: {
    height: 50,
    fontSize: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  listView: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderRadius: 8,
    maxHeight: 200,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 9999,
  },
  loadingIndicator: {
    position: 'absolute',
    right: 12,
    top: 12,
  },
  placeItem: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  placeMainText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  placeSecondaryText: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});

export default GooglePlacesInput;