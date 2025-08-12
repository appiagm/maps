import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  TouchableOpacity, 
  Text, 
  TextInput, 
  FlatList,
  ActivityIndicator 
} from 'react-native';
import { useCachedPlaces } from '../hooks/useCachedPlaces';
import { useAuth } from '../contexts/AuthContext';

interface CachedCitySearchBarProps {
  onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
  customLocation?: { latitude: number; longitude: number };
  style?: any;
}

const CachedCitySearchBar: React.FC<CachedCitySearchBarProps> = ({ 
  onLocationSelect, 
  customLocation, 
  style 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const { user } = useAuth();

  const {
    results,
    isLoading,
    query,
    setQuery,
    searchPlaces,
    handlePlaceSelect,
    clearResults
  } = useCachedPlaces({
    onLocationSelect,
    userLocation: customLocation,
    userId: user?.id
  });

  // Debounced search
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (query.length >= 3) {
        searchPlaces(query);
      }
    }, 800);

    return () => clearTimeout(timeoutId);
  }, [query, searchPlaces]);

  const handleLocationSelect = (location: { latitude: number; longitude: number; address: string }) => {
    onLocationSelect(location);
    setIsExpanded(false);
    clearResults();
  };

  const toggleSearch = () => {
    setIsExpanded(!isExpanded);
    if (!isExpanded) {
      clearResults();
    }
  };

  const renderPlaceItem = ({ item }: { item: any }) => (
    <TouchableOpacity
      style={styles.placeItem}
      onPress={() => {
        handlePlaceSelect(item);
        clearResults();
        setIsExpanded(false);
      }}
    >
      <Text style={styles.placeMainText}>{item.structured_formatting.main_text}</Text>
      <Text style={styles.placeSecondaryText}>{item.structured_formatting.secondary_text}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, style]}>
      {!isExpanded ? (
        <TouchableOpacity style={styles.searchButton} onPress={toggleSearch}>
          <Text style={styles.searchButtonText}>🔍 Search for a city...</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.searchContainer}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder="Search for a city..."
              placeholderTextColor="#666"
              value={query}
              onChangeText={setQuery}
              autoFocus={true}
            />
            {isLoading && (
              <ActivityIndicator 
                style={styles.loadingIndicator} 
                size="small" 
                color="#0066cc" 
              />
            )}
          </View>
          
          {results.length > 0 && (
            <FlatList
              data={results}
              renderItem={renderPlaceItem}
              keyExtractor={(item) => item.place_id}
              style={styles.resultsList}
              keyboardShouldPersistTaps="handled"
            />
          )}
          
          <TouchableOpacity style={styles.closeButton} onPress={toggleSearch}>
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    zIndex: 1000,
  },
  searchButton: {
    backgroundColor: 'white',
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchButtonText: {
    color: '#666',
    fontSize: 16,
    textAlign: 'center',
  },
  searchContainer: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 400,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  textInput: {
    flex: 1,
    height: 50,
    fontSize: 16,
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  loadingIndicator: {
    marginLeft: 10,
  },
  resultsList: {
    maxHeight: 300,
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
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ff4444',
    borderRadius: 15,
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1001,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CachedCitySearchBar; 