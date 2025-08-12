import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { marketplaceService } from '../services/marketplaceService';
import { BusinessMarker } from '../types/marketplace';

interface BusinessMapProps {
  onBusinessSelect?: (businessId: string) => void;
  initialRegion?: Region;
  userLocation?: { latitude: number; longitude: number };
}

export const BusinessMap: React.FC<BusinessMapProps> = ({
  onBusinessSelect,
  initialRegion,
  userLocation,
}) => {
  const [businesses, setBusinesses] = useState<BusinessMarker[]>([]);
  const [loading, setLoading] = useState(true);
  const [region, setRegion] = useState<Region>(
    initialRegion || {
      latitude: 37.78825,
      longitude: -122.4324,
      latitudeDelta: 0.0922,
      longitudeDelta: 0.0421,
    }
  );

  useEffect(() => {
    loadBusinesses();
  }, []);

  const loadBusinesses = async () => {
    try {
      const result = await marketplaceService.getAllBusinessMarkers();
      
      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        setBusinesses(result.data || []);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load businesses');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkerPress = (business: BusinessMarker) => {
    onBusinessSelect?.(business.id);
  };

  const getCategoryColor = (category: string): string => {
    const colors: { [key: string]: string } = {
      'Restaurant': '#FF6B6B',
      'Retail': '#4ECDC4',
      'Services': '#45B7D1',
      'Healthcare': '#96CEB4',
      'Automotive': '#FFEAA7',
      'Beauty & Wellness': '#DDA0DD',
      'Technology': '#74B9FF',
      'Home & Garden': '#6C5CE7',
      'Sports & Recreation': '#A29BFE',
      'Education': '#FD79A8',
    };
    return colors[category] || '#95A5A6';
  };

  const centerOnUserLocation = () => {
    if (userLocation) {
      setRegion({
        ...region,
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
      });
    } else {
      Alert.alert('Location', 'User location not available');
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={region}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
      >
        {businesses.map((business) => (
          <Marker
            key={business.id}
            coordinate={{
              latitude: business.latitude,
              longitude: business.longitude,
            }}
            title={business.name}
            description={`${business.category} • ${business.product_count} products`}
            pinColor={getCategoryColor(business.category)}
            onPress={() => handleMarkerPress(business)}
          />
        ))}
      </MapView>

      {/* Controls */}
      <View style={styles.controls}>
        {userLocation && (
          <TouchableOpacity
            style={styles.locationButton}
            onPress={centerOnUserLocation}
          >
            <Text style={styles.locationButtonText}>📍</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={loadBusinesses}
        >
          <Text style={styles.refreshButtonText}>🔄</Text>
        </TouchableOpacity>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Categories</Text>
        <View style={styles.legendItems}>
          {['Restaurant', 'Retail', 'Services', 'Healthcare'].map((category) => (
            <View key={category} style={styles.legendItem}>
              <View 
                style={[
                  styles.legendColor, 
                  { backgroundColor: getCategoryColor(category) }
                ]} 
              />
              <Text style={styles.legendText}>{category}</Text>
            </View>
          ))}
        </View>
      </View>
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
  controls: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'column',
  },
  locationButton: {
    backgroundColor: '#0066cc',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  locationButtonText: {
    fontSize: 20,
    color: 'white',
  },
  refreshButton: {
    backgroundColor: '#28a745',
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  refreshButtonText: {
    fontSize: 20,
    color: 'white',
  },
  legend: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: 15,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  legendItems: {
    flexDirection: 'column',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#666',
  },
}); 