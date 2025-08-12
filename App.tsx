import React from 'react';
import { StatusBar } from 'expo-status-bar';
import MainScreen from './src/Screens/MainScreen';
import 'react-native-get-random-values'; // 

// Import gesture handler entry point
import 'react-native-gesture-handler';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { AuthProvider } from './src/contexts/AuthContext';

export default function App() {
  return (
    <AuthProvider>
      <SafeAreaProvider>
        <SafeAreaView style={styles.safeAreaWrapper} edges={['top', 'bottom']}>
          <StatusBar style="auto" />
          <MainScreen />
        </SafeAreaView>
      </SafeAreaProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  safeAreaWrapper: {
    flex: 1,
  },
});