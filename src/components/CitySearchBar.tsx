import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text } from 'react-native';
import GooglePlacesInput from './AdressInput';

interface CitySearchBarProps {
    onLocationSelect: (location: { latitude: number; longitude: number; address: string }) => void;
    customLocation?: { latitude: number; longitude: number }; // For testing - simulate being in a different location
    style?: any;
}

const CitySearchBar: React.FC<CitySearchBarProps> = ({ onLocationSelect, customLocation, style }) => {
    const [isExpanded, setIsExpanded] = useState(false);

    const handleLocationSelect = (location: { latitude: number; longitude: number; address: string }) => {
        onLocationSelect(location);
        setIsExpanded(false);
    };

    const toggleSearch = () => {
        setIsExpanded(!isExpanded);
    };

    return (
        <View style={[styles.container, style]}>
            {!isExpanded ? (
                <TouchableOpacity style={styles.searchButton} onPress={toggleSearch}>
                    <Text style={styles.searchButtonText}>🔍 Search for a city...</Text>
                </TouchableOpacity>
            ) : (
                <View style={styles.searchContainer}>
                    <GooglePlacesInput
                        onLocationSelect={handleLocationSelect}
                        customLocation={customLocation}
                    />
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

export default CitySearchBar; 