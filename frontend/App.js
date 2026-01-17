import React, { useEffect, useRef } from 'react';
import { StatusBar, Platform, Linking } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/theme';
import { linkingConfig, DeepLinkingUtils } from './src/navigation/DeepLinking';

/**
 * APLICACIÓN PRINCIPAL HOMECARE
 * 
 * Configuración principal con:
 * - AuthProvider para autenticación global
 * - Navegación condicional según estado de auth
 * - Deep Linking configuration
 * - Configuración de StatusBar
 * - Soporte para gestos
 */
const App = () => {
  const navigationRef = useRef(null);

  const handleDeepLink = (url) => {
    const parsed = DeepLinkingUtils.parseUrl(url);
    
    if (!parsed || parsed.segments.length === 0 || !navigationRef.current) {
      return;
    }

    const [firstSegment, secondSegment] = parsed.segments;

    try {
      switch (firstSegment) {
        case 'login':
          navigationRef.current.navigate('AuthNavigator', { screen: 'Login' });
          break;
        case 'register':
          navigationRef.current.navigate('AuthNavigator', { screen: 'Register' });
          break;
        case 'service':
          if (secondSegment) {
            navigationRef.current.navigate('ClientTabNavigator', {
              screen: 'Home',
              params: {
                screen: 'ServiceDetails',
                params: { serviceId: secondSegment }
              }
            });
          }
          break;
        default:
          console.log('Unknown deep link segment:', firstSegment);
      }
    } catch (error) {
      console.error('Error handling deep link:', error);
    }
  };

  useEffect(() => {
    // Manejar URL inicial
    const handleInitialURL = async () => {
      try {
        const initialUrl = await DeepLinkingUtils.getInitialURL();
        if (initialUrl && navigationRef.current) {
          console.log('Initial URL:', initialUrl);
          setTimeout(() => handleDeepLink(initialUrl), 1000);
        }
      } catch (error) {
        console.error('Error handling initial URL:', error);
      }
    };

    // Manejar URLs mientras la app está abierta
    const subscription = Linking.addEventListener('url', ({ url }) => {
      console.log('Incoming URL:', url);
      if (navigationRef.current) {
        handleDeepLink(url);
      }
    });

    handleInitialURL();

    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <NavigationContainer 
            ref={navigationRef}
            linking={linkingConfig}
          >
            <StatusBar
              barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
              backgroundColor={COLORS.PRIMARY}
              translucent={false}
            />
            
            <AppNavigator />
          </NavigationContainer>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;