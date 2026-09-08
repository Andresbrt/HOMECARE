/**
 * HOMECARE Mobile App — Colorimetría Premium
 * Modo Profesional (dark) + Modo Usuario (light)
 */

import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';

import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { LocationProvider } from './src/context/LocationContext';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import linking from './src/config/linking';

const appDarkTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: '#000F22',
    card: '#001B38',
    text: '#FFFFFF',
    border: 'rgba(255,255,255,0.08)',
  },
};

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#001B38' }}>
        <ActivityIndicator size="large" color="#49C0BC" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: '#000F22' }}>
      <SafeAreaProvider>
        <AuthProvider>
          <LocationProvider>
            <NotificationProvider>
              <NavigationContainer linking={linking} theme={appDarkTheme}>
                <StatusBar style="light" />
                <AppNavigator />
              </NavigationContainer>
            </NotificationProvider>
          </LocationProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

