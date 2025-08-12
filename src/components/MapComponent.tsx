import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Image } from 'react-native';
import MapView, { Marker, Region } from 'react-native-maps';
import { Tunis_COORDS } from '../constants/AppData';
import { Bazar } from '../types';
import { fetchBazaarsWithOwners } from '../services/dataService';

interface MapComponentProps {
    onMarkerPress: (bazar: Bazar) => void;
    searchLocation?: { latitude: number; longitude: number; address: string } | null;
}

const MapComponent: React.FC<MapComponentProps> = ({ onMarkerPress, searchLocation }) => {
    const [bazaars, setBazaars] = useState<Bazar[]>([]);
    const mapRef = useRef<MapView>(null);

    useEffect(() => {
        fetchBazaarsWithOwners()
            .then((data) => {
                // Map the database data to match the expected format
                const mappedBazaars = data.map((bazar: any) => ({
                    ...bazar,
                    position: bazar.location, // location is already {latitude, longitude}
                    imageUrl: bazar.profile_image,
                }));
                setBazaars(mappedBazaars);
            })
            .catch((err) => {
                console.error('Failed to fetch bazaars:', err);
            });
    }, []);

    // Pan to search location when it changes
    useEffect(() => {
        if (searchLocation && mapRef.current) {
            const region: Region = {
                latitude: searchLocation.latitude,
                longitude: searchLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            };
            
            mapRef.current.animateToRegion(region, 1000);
        }
    }, [searchLocation]);

    const handleMarkerPress = (bazar: Bazar) => {
        console.log('Marker pressed:', bazar.name);
        onMarkerPress(bazar);
    };

    return (
        <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={Tunis_COORDS}
            showsUserLocation={true}
            showsMyLocationButton={true}
        >
            {bazaars.map((bazar) => {
                console.log('Bazar in map:', bazar);
                return (
                    <Marker
                        key={bazar.id}
                        coordinate={bazar.position}
                        onPress={() => handleMarkerPress(bazar)}
                        title={bazar.name}
                        description={bazar.description}
                        tracksViewChanges={false}
                    >
                        <View style={styles.customMarker}>
                            <Image source={{ uri: bazar.imageUrl }} style={styles.markerImage} />
                        </View>
                    </Marker>
                );
            })}
        </MapView>
    );
};

const styles = StyleSheet.create({
    map: {
        flex: 1, // Take up all available space in its container
    },
    markerImage: {
        width: 60, // Change this value to resize your marker
        height: 60,
        resizeMode: 'contain',
    },
    customMarker: {
        width: 60,
        height: 60,
        borderRadius: 40,
        backgroundColor: 'transparent',
        alignItems: 'center',
        justifyContent: 'center',
    },
});

export default MapComponent;