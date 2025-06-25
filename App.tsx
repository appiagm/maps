import React from 'react';
import { StatusBar } from 'expo-status-bar';
import MainScreen from './src/Screens/MainScreen';
import 'react-native-get-random-values'; // <--- Add this import statement AT THE TOP

// Import gesture handler entry point
import 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';

export default function App() {
  return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeAreaWrapper} edges={['top']}>
          <StatusBar style="auto" />
          <MainScreen />
        </SafeAreaView>
      </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeAreaWrapper: {
    flex: 1,
  },
});