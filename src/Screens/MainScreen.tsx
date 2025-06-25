import React, { useState } from 'react';
import { StyleSheet, View, Platform, StatusBar } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import GooglePlacesInput from '../components/AdressInput';
import MapComponent from '../components/MapComponent';
import Sidebar from '../components/Sidebar';
import { Merchant } from '../types';

const MainScreen = () => {
    const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);
    const insets = useSafeAreaInsets();

    const handleMarkerSelect = (merchant: Merchant) => {
        setSelectedMerchant(merchant);
    };
    return (
            <View style={styles.container}>
                <GooglePlacesInput />
                    <MapComponent onMarkerPress={handleMarkerSelect} />
                    {/* <Sidebar selectedMerchant={selectedMerchant} /> */}
            </View>
    );
};

const styles = StyleSheet.create({

    container: {
        flex: 1,
        flexDirection: 'column', // Stack AddressInput above mainContent
    },
    // --- Add styles here if doing side-by-side layout ---
    // mapContainer: {
    //   flex: 1, // Or specific flex value e.g., 2
    // },
    // sidebarContainer: {
    //    width: 350, // Or flex: 1
    //    borderLeftWidth: 1,
    //    borderLeftColor: '#ccc',
    // }
});

export default MainScreen;