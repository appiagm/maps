import React, { useState } from 'react';
import { 
    StyleSheet, 
    View, 
    Text, 
    TouchableOpacity, 
    ScrollView, 
    TextInput, 
    Image,
    Alert,
    Modal,
    ActivityIndicator
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import GooglePlacesInput from '../components/AdressInput';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import CountryPicker, { Country, CountryCode } from 'react-native-country-picker-modal';
import { Maps_API_KEY } from '../constants/AppData';
import { AddressForm } from '../components/AddressForm';
import { marketplaceService } from '../services/marketplaceService';

type SetupStep = 1 | 2 | 3;

type Address = {
  street?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
};

const BazaarSetupScreen = ({ onClose }: { onClose: () => void }) => {
    const [currentStep, setCurrentStep] = useState<SetupStep>(1);
    const [selectedCountry, setSelectedCountry] = useState('');
    const [address, setAddress] = useState<Address>({});
    const [countryCode, setCountryCode] = useState<CountryCode>('US');
    const [country, setCountry] = useState<Country | null>(null);
    const [profileData, setProfileData] = useState({
        name: '',
        phone: '',
        address: '',
        country: '',
        language: 'Dutch',
        bio: ''
    });
    const [shopData, setShopData] = useState({
        shopName: '',
        description: '',
        category: '',
        businessHours: '',
        phone: '',
        email: '',
        website: ''
    });
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [privacyAccepted, setPrivacyAccepted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();

    const handleCountrySelect = (country: Country) => {
        setCountryCode(country.cca2);
        setCountry(country);
        setSelectedCountry(country.name as string);
        setAddress((prev) => ({ ...prev, country: country.name as string }));
    };

    const handleNext = () => {
        if (currentStep < 3) {
            setCurrentStep((currentStep + 1) as SetupStep);
        } else {
            // Final submission
            handleSubmit();
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep((currentStep - 1) as SetupStep);
        }
    };

    const handleSubmit = async () => {
        if (!termsAccepted || !privacyAccepted) {
            Alert.alert('Required', 'Please accept the Terms & Conditions and Privacy Policy');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'You must be logged in to create a business');
            return;
        }

        if (!address.latitude || !address.longitude) {
            Alert.alert('Error', 'Please select a location for your business');
            return;
        }

        if (!shopData.shopName.trim()) {
            Alert.alert('Error', 'Please enter your shop name');
            return;
        }

        if (!shopData.category.trim()) {
            Alert.alert('Error', 'Please select a category for your business');
            return;
        }

        setIsSubmitting(true);

        try {
            console.log('=== BUSINESS CREATION DEBUG ===');
            console.log('Current user:', user?.id);
            console.log('Address data:', address);
            console.log('Shop data:', shopData);
            console.log('Profile data:', profileData);
            
            // First, create/update the user profile
            console.log('Creating/updating user profile...');
            const profileResult = await marketplaceService.createUserProfile({
                id: user.id,
                avatar_url: 'https://i.pravatar.cc/300',
                is_seller: true
            });
            
            if (profileResult.error) {
                console.error('Profile creation error:', profileResult.error);
                Alert.alert('Error', `Failed to create profile: ${profileResult.error}`);
                return;
            }
            
            console.log('Profile created/updated successfully:', profileResult.data);
            
            // Create the business data with minimal required fields
            const businessData = {
                owner_id: user.id,
                name: shopData.shopName,
                description: shopData.description || profileData.bio,
                category: shopData.category,
                phone: shopData.phone || profileData.phone,
                email: shopData.email || user.email,
                website: shopData.website || undefined,
                location: {
                    latitude: address.latitude,
                    longitude: address.longitude,
                    address: `${address.street || ''}, ${address.city || ''}, ${address.country || ''}`.trim(),
                    city: address.city,
                    country: address.country
                },
                profile_image: 'https://picsum.photos/id/13/50/50',
                is_active: true
            };

            console.log('Business data prepared:', JSON.stringify(businessData, null, 2));

            const result = await marketplaceService.createBusiness(businessData);
            console.log('Marketplace service result:', result);

            if (result.error) {
                console.error('Business creation error:', result.error);
                Alert.alert('Error', `Failed to create business: ${result.error}`);
                return;
            }

            if (!result.data) {
                console.error('No data returned from business creation');
                Alert.alert('Error', 'Business creation failed - no data returned');
                return;
            }

            console.log('Business created successfully:', result.data);

            Alert.alert(
                'Success!', 
                `Your bazaar "${result.data.name}" has been created successfully!`,
                [{ text: 'OK', onPress: onClose }]
            );

        } catch (error) {
            console.error('Error creating business:', error);
            Alert.alert('Error', 'Failed to create business. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStepIndicator = () => (
        <View style={styles.stepIndicator}>
            <View style={[styles.step, currentStep >= 1 && styles.activeStep]}>
                <Text style={[styles.stepNumber, currentStep >= 1 && styles.activeStepText]}>1</Text>
            </View>
            <View style={[styles.stepLine, currentStep > 1 && styles.activeStepLine]} />
            <View style={[styles.step, currentStep >= 2 && styles.activeStep]}>
                <Text style={[styles.stepNumber, currentStep >= 2 && styles.activeStepText]}>2</Text>
            </View>
            <View style={[styles.stepLine, currentStep > 2 && styles.activeStepLine]} />
            <View style={[styles.step, currentStep >= 3 && styles.activeStep]}>
                <Text style={[styles.stepNumber, currentStep >= 3 && styles.activeStepText]}>3</Text>
            </View>
        </View>
    );

    const renderStep1 = () => (
        <ScrollView style={styles.stepContent}>
            <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>👤</Text>
                <Text style={styles.infoText}>
                    Let's start with your basic profile information. This will help customers get to know you.
                </Text>
            </View>
            <View style={styles.profileSection}>
                <Image
                    source={{ uri: user?.user_metadata?.avatar_url || 'https://via.placeholder.com/80' }}
                    style={styles.profileAvatar}
                />
                <TouchableOpacity style={styles.changePhotoButton}>
                    <Text style={styles.changePhotoText}>Change Profile Picture</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Your Name</Text>
                <TextInput
                    style={styles.textInput}
                    value={profileData.name}
                    onChangeText={(text) => setProfileData({...profileData, name: text})}
                    placeholder="Enter your full name"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                    style={styles.textInput}
                    value={profileData.phone}
                    onChangeText={(text) => setProfileData({...profileData, phone: text})}
                    placeholder="Enter your phone number"
                    keyboardType="phone-pad"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Language</Text>
                <TextInput
                    style={styles.textInput}
                    value={profileData.language}
                    onChangeText={(text) => setProfileData({...profileData, language: text})}
                    placeholder="Select your language"
                />
            </View>
        </ScrollView>
    );

    const renderStep2 = () => (
        <View style={styles.stepContent}>
            <View style={styles.infoBox}>
                <Text style={styles.infoIcon}>📍</Text>
                <Text style={styles.infoText}>
                    Now let's set up your location. This will help customers find your shop.
                </Text>
            </View>
            <AddressForm onAddressChange={(addressData) => {
                setAddress(addressData);
                console.log('Address updated:', addressData);
            }} />
        </View>
    );

    const renderStep3 = () => (
        <ScrollView style={styles.stepContent}>
            <View style={styles.shopIconContainer}>
                <Text style={styles.shopIcon}>🏪</Text>
            </View>
            <Text style={styles.sectionTitle}>Shop Details</Text>
            <Text style={styles.sectionSubtitle}>Tell us about your shop</Text>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Shop Name*</Text>
                <TextInput
                    style={styles.textInput}
                    value={shopData.shopName}
                    onChangeText={(text) => setShopData({...shopData, shopName: text})}
                    placeholder="Enter your shop name"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Category*</Text>
                <TextInput
                    style={styles.textInput}
                    value={shopData.category}
                    onChangeText={(text) => setShopData({...shopData, category: text})}
                    placeholder="e.g., Tailoring, Food, Electronics"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={shopData.description}
                    onChangeText={(text) => setShopData({...shopData, description: text})}
                    placeholder="Tell us about your shop and what you offer"
                    multiline
                    numberOfLines={4}
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                    style={styles.textInput}
                    value={shopData.phone}
                    onChangeText={(text) => setShopData({...shopData, phone: text})}
                    placeholder="Enter your business phone number"
                    keyboardType="phone-pad"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                    style={styles.textInput}
                    value={shopData.email}
                    onChangeText={(text) => setShopData({...shopData, email: text})}
                    placeholder="Enter your business email"
                    keyboardType="email-address"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Website (Optional)</Text>
                <TextInput
                    style={styles.textInput}
                    value={shopData.website}
                    onChangeText={(text) => setShopData({...shopData, website: text})}
                    placeholder="Enter your website URL"
                    keyboardType="url"
                />
            </View>

            <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                    style={[styles.textInput, styles.textArea]}
                    value={profileData.bio}
                    onChangeText={(text) => setProfileData({...profileData, bio: text})}
                    placeholder="Tell us about yourself and your expertise"
                    multiline
                    numberOfLines={4}
                />
                <Text style={styles.helpText}>This helps customers know what you specialize in.</Text>
            </View>

            <View style={styles.checkboxGroup}>
                <TouchableOpacity 
                    style={styles.checkbox}
                    onPress={() => setTermsAccepted(!termsAccepted)}
                >
                    <View style={[styles.checkboxBox, termsAccepted && styles.checkboxChecked]}>
                        {termsAccepted && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxText}>
                        I agree to <Text style={styles.linkText}>Terms & Conditions</Text>
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                    style={styles.checkbox}
                    onPress={() => setPrivacyAccepted(!privacyAccepted)}
                >
                    <View style={[styles.checkboxBox, privacyAccepted && styles.checkboxChecked]}>
                        {privacyAccepted && <Text style={styles.checkmark}>✓</Text>}
                    </View>
                    <Text style={styles.checkboxText}>
                        I agree to <Text style={styles.linkText}>Privacy Policy</Text>
                    </Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );

    const renderStepContent = () => {
        switch (currentStep) {
            case 1:
                return renderStep1();
            case 2:
                return renderStep2();
            case 3:
                return renderStep3();
            default:
                return renderStep1();
        }
    };

    return (
        <Modal
            visible={true}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <View style={styles.container}>
                            <View style={styles.header}>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                    <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>
                    {currentStep === 1 ? 'My Profile' : 
                     currentStep === 2 ? 'Location Setup' : 'Shop Details'}
                </Text>
                <View style={styles.placeholder} />
            </View>
                {renderStepIndicator()}
                {renderStepContent()}

                <View style={styles.footer}>
                    {currentStep > 1 && (
                        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                            <Text style={styles.backButtonText}>Back</Text>
                        </TouchableOpacity>
                    )}
                    <TouchableOpacity 
                        style={[
                            styles.nextButton, 
                            ((currentStep === 1 && !profileData.name) || 
                            (currentStep === 3 && !termsAccepted) ||
                            isSubmitting) ? styles.disabledButton : {}
                        ]} 
                        onPress={handleNext}
                        disabled={(currentStep === 1 && !profileData.name) || 
                                (currentStep === 3 && !termsAccepted) ||
                                isSubmitting}
                    >
                        {isSubmitting ? (
                            <ActivityIndicator color="white" size="small" />
                        ) : (
                            <Text style={styles.nextButtonText}>
                                {currentStep === 3 ? 'Submit' : 'Continue'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 15,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e0e0e0',
    },
    closeButton: {
        padding: 5,
    },
    closeButtonText: {
        fontSize: 24,
        color: '#666',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
    },
    placeholder: {
        width: 30,
    },
    stepIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 20,
        backgroundColor: 'white',
    },
    step: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#e0e0e0',
        alignItems: 'center',
        justifyContent: 'center',
    },
    activeStep: {
        backgroundColor: '#ff6600',
    },
    stepNumber: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#666',
    },
    activeStepText: {
        color: 'white',
    },
    stepLine: {
        width: 40,
        height: 2,
        backgroundColor: '#e0e0e0',
        marginHorizontal: 10,
    },
    activeStepLine: {
        backgroundColor: '#ff6600',
    },
    stepContent: {
        flex: 1,
        paddingHorizontal: 20,
        paddingVertical: 10,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: '#fff3cd',
        padding: 15,
        borderRadius: 8,
        marginBottom: 5,
        alignItems: 'flex-start',
    },
    infoIcon: {
        fontSize: 20,
        marginRight: 10,
        color: '#856404',
    },
    infoText: {
        flex: 1,
        color: '#856404',
        fontSize: 14,
    },
    profileSection: {
        alignItems: 'center',
        marginBottom: 10,
    },
    profileAvatar: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 10,
    },
    changePhotoButton: {
        backgroundColor: '#ff6600',
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderRadius: 20,
    },
    changePhotoText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    inputGroup: {
        marginBottom: 10,
        flexDirection: 'column',
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 5,
    },
    textInput: {
        backgroundColor: 'white',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontSize: 16,
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    helpText: {
        fontSize: 12,
        color: '#666',
        marginTop: 5,
    },
    checkboxGroup: {
        marginTop: 20,
    },
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
    },
    checkboxBox: {
        width: 20,
        height: 20,
        borderWidth: 2,
        borderColor: '#ddd',
        borderRadius: 4,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10,
    },
    checkboxChecked: {
        backgroundColor: '#ff6600',
        borderColor: '#ff6600',
    },
    checkmark: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    checkboxText: {
        fontSize: 14,
        color: '#333',
        flex: 1,
    },
    linkText: {
        color: '#ff6600',
        textDecorationLine: 'underline',
    },
    shopIconContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    shopIcon: {
        fontSize: 60,
        marginBottom: 10,
    },
    sectionTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        textAlign: 'center',
        marginBottom: 5,
    },
    sectionSubtitle: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
        marginBottom: 20,
    },
    addressSummary: {
        backgroundColor: '#e8f5e8',
        padding: 15,
        borderRadius: 8,
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#4caf50',
    },
    addressSummaryTitle: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#2e7d32',
        marginBottom: 10,
    },
    addressSummaryText: {
        fontSize: 14,
        color: '#2e7d32',
        lineHeight: 20,
    },
    autocompleteContainer: {
        flex: 1,
    },
    listView: {
        position: 'absolute',
        top: 55,
        left: 0,
        right: 0,
        backgroundColor: '#fff',
        borderRadius: 8,
        maxHeight: 200,
        borderWidth: 1,
        borderColor: '#ddd',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 1001,
    },
    footer: {
        flexDirection: 'row',
        padding: 20,
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#e0e0e0',
    },
    backButton: {
        flex: 1,
        backgroundColor: '#f0f0f0',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
        marginRight: 10,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#666',
    },
    nextButton: {
        flex: 1,
        backgroundColor: '#ff6600',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    disabledButton: {
        backgroundColor: '#ccc',
    },
    nextButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: 'white',
    },

});

export default BazaarSetupScreen; 