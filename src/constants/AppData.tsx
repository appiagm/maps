import { Merchant } from '../types';

// --- IMPORTANT: REPLACE WITH YOUR ACTUAL KEYS/IDs ---
// --- DO NOT COMMIT THESE TO VERSION CONTROL ---
export const Maps_API_KEY = 'AIzaSyCJPvhSvE-OZIOeaQGDHmltD8bDHsr8BEs'; // Used for Places Autocomplete
export const GOOGLE_MAP_ID = 'b09b55e094fe2cfd'; // Used for MapView
// --- ----------------------------------------- ---

export const HAARLEM_COORDS = {
    latitude: 52.387115885918234,
    longitude: 4.643562684635954,
    latitudeDelta: 0.04, // Adjust for desired zoom level
    longitudeDelta: 0.02,
};

export const MERCHANTS_DATA: Merchant[] = [
    { id: 1, name: 'Haarlem Cafe Central', position: { latitude: 52.3809, longitude: 4.6361 }, description: 'Cozy cafe, great coffee & pastries.', category: 'Cafe', imageUrl: 'https://picsum.photos/id/1060/50/50' },
    { id: 2, name: 'Grote Markt Books', position: { latitude: 52.3815, longitude: 4.6325 }, description: 'Independent bookstore, wide selection.', category: 'Books', imageUrl: 'https://picsum.photos/id/24/50/50' },
    { id: 3, name: 'Spaarne Bicycle Repair', position: { latitude: 52.3780, longitude: 4.6380 }, description: 'Fast and friendly bike repairs.', category: 'Services', imageUrl: 'https://picsum.photos/id/146/50/50' },
    { id: 4, name: 'Bloemenmarkt Florist', position: { latitude: 52.3822, longitude: 4.6348 }, description: 'Fresh flowers delivered daily.', category: 'Shopping', imageUrl: 'https://picsum.photos/id/1080/50/50' },
];