// src/screens/MinimalMapTestScreen.tsx (New File)
import React from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
// Import your key if needed, or paste directly for test
// import { Maps_API_KEY } from '../constants/AppData';

const MinimalMapTestScreen = () => {
    return (
        <View style={StyleSheet.absoluteFillObject}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={StyleSheet.absoluteFillObject}
                // googleMapId={'YOUR_COPIED_MAP_ID'} // Try WITH and WITHOUT this line
                initialRegion={{
                    latitude: 52.3809,
                    longitude: 4.6361,
                    latitudeDelta: 0.0922, // Use slightly wider initial view
                    longitudeDelta: 0.0421,
                }}
            >
                {/* A single, standard marker using default pin */}
                <Marker
                    coordinate={{ latitude: 52.3809, longitude: 4.6361 }}
                    title={"Center Test Marker"}
                    description={"Does a standard pin appear?"}
                    pinColor={"green"} // Use a standard color
                />
                {/* Add another one slightly offset */}
                <Marker
                    coordinate={{ latitude: 52.385, longitude: 4.64 }}
                    title={"Offset Test Marker"}
                    pinColor={"red"}
                />
            </MapView>
        </View>
    );
};
export default MinimalMapTestScreen;

// In App.tsx - Temporarily replace MainScreen import/usage
// import MinimalMapTestScreen from './src/screens/MinimalMapTestScreen';
// export default function App() { return <MinimalMapTestScreen />; }