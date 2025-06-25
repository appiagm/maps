import React from 'react';
import { StyleSheet, View, ImageBackground, Text, Image } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { HAARLEM_COORDS, MERCHANTS_DATA } from '../constants/AppData';
import { Merchant } from '../types';

interface MapComponentProps {
    onMarkerPress: (merchant: Merchant) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ onMarkerPress }) => {
    const handleMarkerPress = (merchant: Merchant) => {
        console.log('Marker pressed:', merchant.name);
        onMarkerPress(merchant);
    };

    return (
        <MapView
            style={styles.map}
            initialRegion={HAARLEM_COORDS}
            showsUserLocation={true}
            showsMyLocationButton={true}
        >
            {MERCHANTS_DATA.map((merchant) => (
                <Marker
                    key={merchant.id}
                    coordinate={merchant.position}
                    onPress={() => handleMarkerPress(merchant)}
                    title={merchant.name}
                    description={merchant.description}
                    tracksViewChanges={false}
                >
                    <View style={styles.customMarker}>
                        <Image source={{ uri: merchant.imageUrl }} style={styles.markerImage} />
                    </View>
                </Marker>
            ))}
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