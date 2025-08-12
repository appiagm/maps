# Google API Usage Logging System

This system provides comprehensive logging and cost tracking for all Google API calls in your React Native app. It tracks usage, costs, errors, and provides detailed analytics.

## 🚀 Features

- **Automatic Logging**: Tracks all Google Places, Maps, and Geocoding API calls
- **Cost Calculation**: Real-time cost tracking based on Google's pricing
- **Usage Analytics**: Detailed breakdown by API, endpoint, and timeframe
- **Error Tracking**: Logs failed requests and errors
- **User Attribution**: Links API calls to specific users
- **Data Export**: Export usage data for analysis
- **Dashboard UI**: Beautiful dashboard to view usage statistics

## 📊 Supported APIs

### Google Places API
- **Autocomplete**: $0.00283 per request
- **Details**: $0.017 per request
- **Nearby Search**: $0.032 per request
- **Text Search**: $0.032 per request

### Google Geocoding API
- **Forward Geocoding**: $0.005 per request
- **Reverse Geocoding**: $0.005 per request

### Google Maps API
- **Static Maps**: $0.002 per request
- **Dynamic Maps**: $0.007 per request

## 🛠️ Setup

### 1. Automatic Integration

The logging system is already integrated into your existing `AdressInput.tsx` component. All Google Places Autocomplete calls are automatically logged.

### 2. Manual Integration

If you want to add logging to other Google API calls, use the logger directly:

```typescript
import { googleApiLogger } from '../services/googleApiLogger';

// Log a successful Places API call
googleApiLogger.logPlacesApiEvent(
  'autocomplete',
  { input: 'search query' },
  responseData,
  true,
  undefined,
  userId
);

// Log a failed call
googleApiLogger.logPlacesApiEvent(
  'autocomplete',
  { input: 'search query' },
  null,
  false,
  'API key invalid',
  userId
);

// Log Geocoding API calls
googleApiLogger.logGeocodingApiEvent(
  'forward',
  { address: '123 Main St' },
  responseData,
  true,
  undefined,
  userId
);

// Log Maps API calls
googleApiLogger.logMapsApiEvent(
  'dynamic',
  { center: '40.7128,-74.0060' },
  responseData,
  true,
  undefined,
  userId
);
```

## 📱 Using the Dashboard

### Adding the Dashboard Button

Add the usage button to any screen:

```typescript
import GoogleApiUsageButton from '../components/GoogleApiUsageButton';

// In your component
<GoogleApiUsageButton style={{ marginTop: 10 }} />
```

### Dashboard Features

1. **Timeframe Selection**: View data for day, week, month, or all time
2. **Summary Statistics**: Total requests, costs, errors, and average cost per request
3. **Cost Breakdown**: Detailed breakdown by API and endpoint
4. **Recent Events**: Latest API calls with success/failure status
5. **Data Export**: Export all events to console for analysis
6. **Data Management**: Clear all logged data

## 📈 Usage Analytics

### Get Usage Statistics

```typescript
import { googleApiLogger } from '../services/googleApiLogger';

// Get usage stats for different timeframes
const dailyStats = googleApiLogger.getUsageStats('day');
const weeklyStats = googleApiLogger.getUsageStats('week');
const monthlyStats = googleApiLogger.getUsageStats('month');
const allTimeStats = googleApiLogger.getUsageStats('all');

console.log('Daily cost:', dailyStats.totalCost);
console.log('Total requests:', allTimeStats.totalRequests);
```

### Get Cost Breakdown

```typescript
const breakdown = googleApiLogger.getCostBreakdown('month');

console.log('Places API cost:', breakdown.places.autocomplete.cost);
console.log('Geocoding requests:', breakdown.geocoding.forward.requests);
```

### Get Recent Events

```typescript
const recentEvents = googleApiLogger.getEvents(50); // Last 50 events
recentEvents.forEach(event => {
  console.log(`${event.api}.${event.endpoint}: $${event.cost}`);
});
```

## 🔧 Configuration

### Update Pricing

Edit the pricing constants in `src/services/googleApiLogger.ts`:

```typescript
const GOOGLE_API_PRICING = {
  places: {
    autocomplete: {
      perRequest: 0.00283, // Update this rate
      per1000: 2.83,
    },
    // ... other endpoints
  },
  // ... other APIs
};
```

### Analytics Integration

The logger automatically sends events to analytics if available:

```typescript
// In your app initialization
if (typeof global !== 'undefined') {
  (global as any).analytics = yourAnalyticsService;
}
```

## 📊 Data Storage

All events are stored locally using AsyncStorage:

- **Key**: `google_api_events`
- **Format**: JSON array of `GoogleApiEvent` objects
- **Persistence**: Survives app restarts
- **Size**: Events are kept indefinitely (clear manually if needed)

## 🚨 Error Handling

The logger handles various error scenarios:

- **Network failures**: Logged as failed events
- **Invalid responses**: Tracked with error messages
- **Rate limiting**: Monitored for cost optimization
- **API key issues**: Identified for quick resolution

## 💰 Cost Optimization

### Monitor High-Cost Endpoints

```typescript
const breakdown = googleApiLogger.getCostBreakdown('month');

// Check which endpoints are costing the most
Object.entries(breakdown.places).forEach(([endpoint, data]) => {
  if (data.cost > 10) { // Alert if cost > $10
    console.warn(`High cost endpoint: ${endpoint} - $${data.cost}`);
  }
});
```

### Set Usage Alerts

```typescript
const stats = googleApiLogger.getUsageStats('day');

if (stats.totalCost > 5) { // Alert if daily cost > $5
  console.warn(`Daily API cost exceeded: $${stats.totalCost}`);
}
```

## 🔍 Debugging

### Enable Console Logging

All API events are logged to console with cost information:

```
Google API Event: places.autocomplete - $0.0028
Google API Event: geocoding.forward - $0.0050
```

### Export Data for Analysis

```typescript
const exportData = googleApiLogger.exportEvents();
console.log('API Events Export:', exportData);
```

## 📋 Event Structure

Each logged event contains:

```typescript
interface GoogleApiEvent {
  id: string;                    // Unique event ID
  timestamp: number;             // Unix timestamp
  api: 'places' | 'geocoding' | 'maps';
  endpoint: string;              // Specific endpoint
  method: string;                // HTTP method
  requestData?: any;             // Request parameters
  responseData?: any;            // Response data (if successful)
  success: boolean;              // Success/failure status
  error?: string;                // Error message (if failed)
  cost: number;                  // Calculated cost
  sessionId?: string;            // Session identifier
  userId?: string;               // User ID (if authenticated)
}
```

## 🎯 Best Practices

1. **Monitor Regularly**: Check the dashboard weekly to track usage trends
2. **Set Budget Alerts**: Implement cost monitoring for your use case
3. **Optimize Queries**: Use debouncing and caching to reduce API calls
4. **Handle Errors**: Implement proper error handling for failed requests
5. **Export Data**: Regularly export data for external analysis
6. **Update Pricing**: Keep pricing constants updated with Google's latest rates

## 🔄 Migration Guide

### From Unlogged to Logged

1. Replace direct Google API calls with logged versions
2. Update components to use `LoggedGooglePlacesInput`
3. Add the dashboard button to your main screens
4. Monitor initial usage to ensure proper logging

### Example Migration

```typescript
// Before (unlogged)
<GooglePlacesAutocomplete
  onPress={(data) => handleSelection(data)}
  // ... other props
/>

// After (logged)
<LoggedGooglePlacesInput
  onLocationSelect={(location) => handleSelection(location)}
  // ... other props
/>
```

## 📞 Support

For issues or questions about the logging system:

1. Check the console for error messages
2. Verify API keys are valid
3. Ensure proper imports and dependencies
4. Review the event structure for debugging

The system is designed to be non-intrusive and will continue working even if logging fails, ensuring your app's functionality is never compromised. 