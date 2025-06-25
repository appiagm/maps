import React from 'react';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { Maps_API_KEY } from '../constants/AppData';
import { StyleSheet, View } from 'react-native';

const GooglePlacesInput = () => {
  return (
    <View style={styles.container}>
      <GooglePlacesAutocomplete
        placeholder='Search for a Location'
        textInputProps={{ placeholderTextColor: '#666' }}
        styles={{
          container: styles.autocompleteContainer,
          textInput: styles.textInput,
          listView: styles.listView,
        }}
        onPress={((data: any, details: any = null) => { 
          console.log(data, details); 
        }) as any}
        query={{
          key: Maps_API_KEY,
          language: 'en',
          components: 'country:nl', // Prioritize Netherlands but allow others
          location: '52.3676, 4.9041', // Amsterdam coordinates for location bias
          radius: 50000, // 50km radius for proximity
          types: '(cities)', // Focus on cities and places
        }}
        predefinedPlaces={[]}
        enablePoweredByContainer={false}
        fetchDetails={true}
        debounce={300}
        minLength={2}
        keyboardShouldPersistTaps="handled"
        listViewDisplayed="auto"
        onFail={(e) => { console.warn('Google Place Failed:', e) }}
        onNotFound={() => { console.log('No results found') }}
        timeout={10000}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'transparent',
    zIndex: 1000, // Ensure dropdown appears above map
    elevation: 1000, // Android elevation
  },
  autocompleteContainer: {
    flex: 1,
  },
  textInput: {
    height: 50,
    fontSize: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  listView: {
    position: 'absolute',
    top: 55, // Position below the text input
    left: 10,
    right: 10,
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
});

export default GooglePlacesInput;