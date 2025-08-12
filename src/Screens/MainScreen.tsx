import React, { useState } from 'react';
import { StyleSheet, View, Platform, StatusBar, TouchableOpacity, Text, Modal, ScrollView, Image } from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import GooglePlacesInput from '../components/AdressInput';
import MapComponent from '../components/MapComponent';
import { Auth } from '../components/Auth';
import { Bazar } from '../types';
import BazarCard from '../components/BazarCard';
import { useAuth } from '../contexts/AuthContext';
import BazaarSetupScreen from './BazaarSetupScreen';
import CachedCitySearchBar from '../components/CachedCitySearchBar';

type BazarWithOwner = Bazar & { owner?: any };

const MainScreen = () => {
    const [selectedBazar, setSelectedBazar] = useState<BazarWithOwner | null>(null);
    const [showAuth, setShowAuth] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [showBazaarSetup, setShowBazaarSetup] = useState(false);
    const [searchLocation, setSearchLocation] = useState<{ latitude: number; longitude: number; address: string } | null>(null);
    const insets = useSafeAreaInsets();
    const { user, signOut } = useAuth();

    // Custom location for testing - simulate being in Morocco
    const moroccoLocation = {
        latitude: 33.5731, // Casablanca, Morocco
        longitude: -7.5898,
    };

    const handleMarkerSelect = (bazar: BazarWithOwner) => {
        setSelectedBazar(bazar);
    };

    const handleLocationSearch = (location: { latitude: number; longitude: number; address: string }) => {
        setSearchLocation(location);
        console.log('Searching for location:', location);
    };

    const handleViewProfile = () => {
        setShowProfileModal(true);
    };

    const handleCloseProfileModal = () => {
        setShowProfileModal(false);
    };

    // Helper to get city from owner profile
    const getOwnerCity = (owner: any) => {
        if (!owner || !owner.location) return '';
        try {
            const loc = typeof owner.location === 'string' ? JSON.parse(owner.location) : owner.location;
            return loc.city || '';
        } catch {
            return '';
        }
    };

    const handleAuthButtonPress = () => {
        if (user) {
            // User is logged in, so log them out
            signOut();
        } else {
            // User is not logged in, show auth modal
            setShowAuth(true);
        }
    };

    const handleOpenBazaarPress = () => {
        setShowBazaarSetup(true);
    };

    return (
        <View style={styles.container}>
            <MapComponent 
                onMarkerPress={handleMarkerSelect} 
                searchLocation={searchLocation}
            />
            <CachedCitySearchBar 
                onLocationSelect={handleLocationSearch} 
                customLocation={moroccoLocation}
            />
            {/* <Sidebar selectedBazar={selectedBazar} /> */}
            {selectedBazar && (
                <BazarCard
                    bazar={selectedBazar}
                    onClose={() => setSelectedBazar(null)}
                    onViewProfile={handleViewProfile}
                />
            )}
            {/* Business/Shop Details Modal */}
            <Modal
                visible={showProfileModal}
                animationType="slide"
                transparent={true}
                onRequestClose={handleCloseProfileModal}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.profileModalCard}>
                        <TouchableOpacity style={styles.closeButton} onPress={handleCloseProfileModal}>
                            <Text style={styles.closeButtonText}>×</Text>
                        </TouchableOpacity>
                        {selectedBazar && (
                            <ScrollView>
                                {/* Owner Info */}
                                <View style={{ alignItems: 'center', marginBottom: 16 }}>
                                    <Image
                                        source={{ uri: selectedBazar.owner?.avatar_url || selectedBazar.imageUrl }}
                                        style={styles.profileAvatar}
                                    />
                                    <Text style={styles.profileName}>{selectedBazar.owner?.name || selectedBazar.owner?.full_name || selectedBazar.name}</Text>
                                    <Text style={styles.profileCity}>{getOwnerCity(selectedBazar.owner)}</Text>
                                </View>
                                {/* Business Info */}
                                <Text style={styles.shopTitle}>{selectedBazar.name}</Text>
                                <Text style={styles.shopDescription}>{selectedBazar.description}</Text>
                                <Text style={styles.shopCategory}>Category: {selectedBazar.category}</Text>
                                <Text style={styles.shopHours}>Business Hours: {selectedBazar.business_hours}</Text>
                                <Text style={styles.shopContact}>Phone: {selectedBazar.phone}</Text>
                                <Text style={styles.shopContact}>Email: {selectedBazar.email}</Text>
                                <Text style={styles.shopContact}>Website: {selectedBazar.website}</Text>
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
            {/* Auth Test Button */}
            <TouchableOpacity 
                style={styles.authButton} 
                onPress={handleAuthButtonPress}
            >
                <Text style={styles.authButtonText}>{user ? 'Logout' : 'Login'}</Text>
            </TouchableOpacity>
            
            {/* Open Bazaar Button - Only show when user is logged in */}
            {user && (
                <TouchableOpacity 
                    style={styles.openBazaarButton} 
                    onPress={handleOpenBazaarPress}
                >
                    <Text style={styles.openBazaarButtonText}>Open Your Bazaar</Text>
                </TouchableOpacity>
                
            )}
            {/* Auth Modal */}
            <Modal
                visible={showAuth}
                animationType="slide"
                presentationStyle="pageSheet"
            >
                <View style={styles.modalContainer}>
                    <TouchableOpacity 
                        style={styles.closeButton}
                        onPress={() => setShowAuth(false)}
                    >
                        <Text style={styles.closeButtonText}>✕ Close</Text>
                    </TouchableOpacity>
                    <Auth />
                </View>
            </Modal>
            
            {/* Bazaar Setup Modal */}
            {showBazaarSetup && (
                <BazaarSetupScreen onClose={() => setShowBazaarSetup(false)} />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        flexDirection: 'column',
    },
    authButton: {
        position: 'absolute',
        top: 100,
        right: 20,
        backgroundColor: '#0066cc',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        zIndex: 1000,
    },
    authButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    openBazaarButton: {
        position: 'absolute',
        top: 250,
        right: 20,
        backgroundColor: '#ff6600',
        paddingHorizontal: 15,
        paddingVertical: 10,
        borderRadius: 8,
        zIndex: 1000,
    },
    openBazaarButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    closeButton: {
        alignSelf: 'flex-end',
        margin: 20,
        backgroundColor: '#666',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 6,
    },
    closeButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.3)',
        justifyContent: 'flex-end',
    },
    profileModalCard: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 24,
        minHeight: 400,
        maxHeight: '80%',
    },
    profileAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 8,
    },
    profileName: {
        fontWeight: 'bold',
        fontSize: 20,
        textAlign: 'center',
    },
    profileCity: {
        color: '#888',
        textAlign: 'center',
        marginBottom: 12,
    },
    shopTitle: {
        fontWeight: 'bold',
        fontSize: 18,
        marginBottom: 4,
    },
    shopDescription: {
        marginBottom: 8,
    },
    shopCategory: {
        marginBottom: 4,
    },
    shopHours: {
        marginBottom: 4,
    },
    shopContact: {
        marginBottom: 2,
    },
});

export default MainScreen;