export interface Merchant {
    id: number;
    name: string;
    position: {
        latitude: number;
        longitude: number;
    };
    description: string;
    category: string;
    imageUrl: string;
}

export interface Message {
    id: string; // Use unique IDs for keys
    text: string;
    type: 'user' | 'merchant' | 'system' | 'error';
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