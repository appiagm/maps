export interface Bazar {
    id: number;
    created_at: string;
    owner_id: string;
    name: string;
    description: string;
    category: string;
    phone: string;
    email: string;
    website: string;
    location: {
        latitude: number;
        longitude: number;
    };
    business_hours: string;
    profile_image: string;
    is_active: boolean;
    updated_at: string;
    // For map compatibility
    position: {
        latitude: number;
        longitude: number;
    };
    imageUrl: string;
}

export interface Message {
    id: string; // Use unique IDs for keys
    text: string;
    type: 'user' | 'bazar' | 'system' | 'error';
}

// Define Place Details structure from Google Places Autocomplete
export interface PlaceDetails {
    description: string; // Typically the formatted address or name
    place_id: string;
    // Add other fields you might request like geometry, etc.
}

export interface PlaceData {
    details: PlaceDetails | null; // Details from GooglePlacesAutocomplete.getPlace() or similar
    geometry: {
        location: {
            lat: number;
            lng: number;
        };
        viewport: {
            northeast: { lat: number; lng: number; };
            southwest: { lat: number; lng: number; };
        }
    } | null;
    // Add other fields like formatted_address, name, etc. if needed
}