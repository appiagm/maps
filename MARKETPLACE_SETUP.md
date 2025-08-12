# Marketplace Setup Guide

This guide will help you set up the complete marketplace functionality with location-based business listings.

## 🏗️ What You've Built

Your marketplace app now includes:

### 🔐 **Authentication System**
- User registration and login
- Session management with Supabase
- Protected routes and features

### 🏪 **Business Management**
- Business registration with location
- Category-based organization
- Owner permissions and management

### 📍 **Location Features**
- Address input integration
- Google Maps with business markers
- Location-based search
- Distance calculations

### 🛍️ **Product Management**
- Product listing per business
- Category management
- Inventory tracking

## 🚀 Getting Started

### 1. Database Setup

1. **Go to your Supabase Dashboard** → SQL Editor
2. **Copy and paste the entire contents** of `database-schema.sql`
3. **Run the SQL** to create all tables and policies
4. **Verify tables created**: Check that `profiles`, `businesses`, and `products` tables exist

### 2. User Profile Creation

After a user signs up, they need a profile:

```tsx
import { marketplaceService } from './src/services/marketplaceService';
import { useAuth } from './src/contexts/AuthContext';

// Create user profile after sign up
const { user } = useAuth();
if (user && !userProfile) {
  await marketplaceService.createUserProfile({
    id: user.id,
    email: user.email,
    is_seller: true, // Allow user to create businesses
  });
}
```

### 3. Test the Components

Add these to your app to test functionality:

#### **Test Business Creation**
```tsx
import { AddBusinessForm } from './src/components/AddBusinessForm';

// Add to a screen with modal or navigation
<AddBusinessForm 
  onBusinessCreated={() => console.log('Business created!')}
  onCancel={() => console.log('Cancelled')}
/>
```

#### **Test Business Map**
```tsx
import { BusinessMap } from './src/components/BusinessMap';

// Replace your current MapComponent with:
<BusinessMap 
  onBusinessSelect={(id) => console.log('Selected business:', id)}
  userLocation={{ latitude: 37.7749, longitude: -122.4194 }}
/>
```

## 🔧 Integration Steps

### Step 1: Update Your MapComponent

Replace your current map with the new BusinessMap:

```tsx
// In MainScreen.tsx
import { BusinessMap } from '../components/BusinessMap';

// Replace MapComponent with:
<BusinessMap 
  onBusinessSelect={handleBusinessSelect}
  userLocation={userLocation} // from your geolocation
/>
```

### Step 2: Add Business Creation

Add a floating action button to create businesses:

```tsx
// In MainScreen.tsx
const [showAddBusiness, setShowAddBusiness] = useState(false);

// Add button and modal
<TouchableOpacity 
  style={styles.addBusinessButton}
  onPress={() => setShowAddBusiness(true)}
>
  <Text style={styles.addBusinessButtonText}>+ Add Business</Text>
</TouchableOpacity>

<Modal visible={showAddBusiness} animationType="slide">
  <AddBusinessForm 
    onBusinessCreated={() => {
      setShowAddBusiness(false);
      // Refresh map
    }}
    onCancel={() => setShowAddBusiness(false)}
  />
</Modal>
```

### Step 3: Integrate Address Input

Connect your GooglePlacesInput with business creation:

```tsx
// Modify AddBusinessForm to use your existing address input
// When address is selected, convert to Location object:

const handleAddressSelect = (details) => {
  const location = {
    latitude: details.geometry.location.lat,
    longitude: details.geometry.location.lng,
    address: details.formatted_address,
    city: extractCity(details),
    state: extractState(details),
    country: extractCountry(details),
  };
  setLocation(location);
};
```

## 📊 Example Usage Flows

### **Seller Flow**
1. User signs up/logs in
2. Creates user profile with `is_seller: true`
3. Taps "Add Business" button
4. Fills business form + selects location
5. Business appears on map for all users

### **Buyer Flow**
1. User opens map
2. Sees all business markers
3. Taps marker to see business details
4. Views products and contacts seller

## 🛠️ Available Services

### **Marketplace Service**
```tsx
import { marketplaceService } from './src/services/marketplaceService';

// User profiles
await marketplaceService.createUserProfile(profileData);
await marketplaceService.getUserProfile(userId);

// Businesses
await marketplaceService.createBusiness(businessData);
await marketplaceService.getAllBusinessMarkers();
await marketplaceService.searchBusinessesByLocation(params);

// Products
await marketplaceService.createProduct(productData);
await marketplaceService.getProductsByBusiness(businessId);
```

## 🔍 Testing Guide

### **Test Data Creation**

1. **Create a test business** (run after user login):
```sql
-- In Supabase SQL Editor
INSERT INTO businesses (owner_id, name, category, location) 
VALUES (
  auth.uid(), 
  'Test Coffee Shop', 
  'Restaurant',
  '{"latitude": 37.7749, "longitude": -122.4194, "address": "123 Main St, San Francisco, CA"}'
);
```

2. **Add test products**:
```sql
INSERT INTO products (business_id, name, price, category, currency)
SELECT id, 'Espresso', 4.50, 'Food & Beverages', 'USD'
FROM businesses 
WHERE owner_id = auth.uid()
LIMIT 1;
```

### **Verification Steps**

1. ✅ User can sign up/login
2. ✅ User profile is created
3. ✅ Business form accepts location
4. ✅ Business appears on map
5. ✅ Map shows different colored markers
6. ✅ Clicking marker shows business info

## 🚨 Common Issues

### **"No businesses showing on map"**
- Check if businesses exist in database
- Verify `is_active = true` in businesses table
- Check console for API errors

### **"Can't create business"**
- Ensure user is authenticated
- Check user has profile in `profiles` table
- Verify location data is properly formatted

### **"Location not working"**
- Integrate with your GooglePlacesInput component
- Ensure location permissions are granted
- Check address geocoding results

## 🔗 Next Steps

1. **Integrate with your existing GooglePlacesInput**
2. **Add product management UI**
3. **Implement business detail views**
4. **Add search and filtering**
5. **Set up push notifications for new businesses**

Your marketplace foundation is ready! 🎉

## 📞 Integration Help

The components are designed to work with your existing:
- ✅ Google Maps setup
- ✅ Address input functionality  
- ✅ Authentication system
- ✅ TypeScript configuration

Just connect the pieces together and you'll have a fully functional location-based marketplace! 