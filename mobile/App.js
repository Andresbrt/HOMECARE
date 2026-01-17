/**
 * HOMECARE Mobile App
 * Modelo inDriver: Ofertas competitivas
 * Diseño Minimalista Profesional
 */

import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { NotificationProvider } from './src/context/NotificationContext';
import { LocationProvider } from './src/context/LocationContext';

export default function App() {
  return (
    <AuthProvider>
      <LocationProvider>
        <NotificationProvider>
          <NavigationContainer>
            <StatusBar style="auto" />
            <AppNavigator />
          </NavigationContainer>
        </NotificationProvider>
      </LocationProvider>
    </AuthProvider>
  );
}
