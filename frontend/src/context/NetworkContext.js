/**
 * 🌐 NETWORK CONTEXT
 * 
 * Provides real-time network connectivity status to the entire app.
 * Uses @react-native-community/netinfo for accurate detection.
 * 
 * Features:
 * - Real-time connection status (online/offline)
 * - Connection type (wifi, cellular, ethernet, etc.)
 * - Internet reachability (not just network connection)
 * - Cellular generation detection (2G, 3G, 4G, 5G)
 * - Automatic alerts for offline status
 * 
 * @module NetworkContext
 * @version 2.0.0 - Updated for marzo 2026
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Alert, AppState } from 'react-native';

// ============================================
// 📡 CONTEXT CREATION
// ============================================

const NetworkContext = createContext({
  isConnected: true,
  isInternetReachable: true,
  connectionType: 'unknown',
  connectionDetails: null,
  refreshNetworkStatus: () => {},
});

// ============================================
// 🌐 NETWORK PROVIDER
// ============================================

export function NetworkProvider({ 
  children, 
  showAlerts = true,          // Show alert when offline
  checkInterval = 30000        // Check every 30 seconds
}) {
  const [isConnected, setIsConnected] = useState(true);
  const [isInternetReachable, setIsInternetReachable] = useState(true);
  const [connectionType, setConnectionType] = useState('unknown');
  const [connectionDetails, setConnectionDetails] = useState(null);
  const [lastAlertTime, setLastAlertTime] = useState(0);

  /**
   * Handle network state changes
   */
  const handleNetworkStateChange = useCallback((state) => {
    if (__DEV__) {
      console.log('📡 [Network] State changed:', {
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
        details: state.details,
      });
    }

    setIsConnected(state.isConnected ?? false);
    setIsInternetReachable(state.isInternetReachable ?? false);
    setConnectionType(state.type || 'unknown');
    setConnectionDetails(state.details);

    // Show alert if connection lost
    if (!state.isConnected && showAlerts) {
      const now = Date.now();
      // Avoid spam: only show alert every 5 seconds
      if (now - lastAlertTime > 5000) {
        Alert.alert(
          '📡 Sin conexión',
          'No tienes conexión a internet. Algunas funciones podrían no estar disponibles.',
          [{ text: 'Entendido', style: 'cancel' }],
          { cancelable: true }
        );
        setLastAlertTime(now);
      }
    }

    // Optional: Show alert when connection restored
    // if (state.isConnected && !isConnected && showAlerts) {
    //   Alert.alert(
    //     '✅ Conexión restaurada',
    //     'Tu conexión a internet ha sido restaurada.',
    //     [{ text: 'OK' }]
    //   );
    // }
  }, [isConnected, showAlerts, lastAlertTime]);

  /**
   * Manually refresh network status
   */
  const refreshNetworkStatus = useCallback(async () => {
    try {
      const state = await NetInfo.fetch();
      handleNetworkStateChange(state);
    } catch (error) {
      console.error('❌ [Network] Error fetching state:', error);
    }
  }, [handleNetworkStateChange]);

  /**
   * Subscribe to network changes
   */
  useEffect(() => {
    // Initial fetch
    refreshNetworkStatus();

    // Subscribe to changes
    const unsubscribe = NetInfo.addEventListener(handleNetworkStateChange);

    return () => {
      unsubscribe();
    };
  }, [refreshNetworkStatus, handleNetworkStateChange]);

  /**
   * Re-check on app state change (foreground)
   */
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        refreshNetworkStatus();
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [refreshNetworkStatus]);

  /**
   * Periodic check (optional, as NetInfo already uses native listeners)
   */
  useEffect(() => {
    if (checkInterval <= 0) return;

    const interval = setInterval(() => {
      refreshNetworkStatus();
    }, checkInterval);

    return () => clearInterval(interval);
  }, [checkInterval, refreshNetworkStatus]);

  const value = {
    isConnected,
    isInternetReachable,
    connectionType,
    connectionDetails,
    refreshNetworkStatus,
  };

  return (
    <NetworkContext value={value}>
      {children}
    </NetworkContext>
  );
}

// ============================================
// 🪝 CUSTOM HOOK
// ============================================

/**
 * Hook to access network status
 * @returns {Object} Network status and refresh function
 */
export const useNetwork = () => {
  const context = useContext(NetworkContext);

  if (!context) {
    throw new Error('useNetwork must be used within NetworkProvider');
  }

  return context;
};

// ============================================
// 🛡️ HIGHER-ORDER COMPONENT (Optional)
// ============================================

/**
 * HOC to protect components that require internet
 * @param {Component} Component - Component to wrap
 * @param {Component} FallbackComponent - Component to show when offline
 * @returns {Component}
 */
export function withNetworkCheck(Component, FallbackComponent) {
  return function NetworkCheckWrapper(props) {
    const { isConnected } = useNetwork();

    if (!isConnected && FallbackComponent) {
      return <FallbackComponent {...props} />;
    }

    return <Component {...props} />;
  };
}

// ============================================
// 🎨 HELPER FUNCTIONS
// ============================================

/**
 * Get human-readable connection type
 * @param {string} type - Connection type from NetInfo
 * @returns {string}
 */
export const getConnectionTypeName = (type) => {
  const names = {
    'none': 'Sin conexión',
    'unknown': 'Desconocido',
    'wifi': 'WiFi',
    'cellular': 'Datos móviles',
    'ethernet': 'Ethernet',
    'bluetooth': 'Bluetooth',
    'wimax': 'WiMAX',
    'vpn': 'VPN',
    'other': 'Otra',
  };

  return names[type] || type;
};

/**
 * Get cellular generation name
 * @param {Object} details - Connection details from NetInfo
 * @returns {string}
 */
export const getCellularGeneration = (details) => {
  if (!details || !details.cellularGeneration) {
    return 'Desconocido';
  }

  return details.cellularGeneration; // '2g', '3g', '4g', '5g'
};

/**
 * Check if connection is fast enough for video/heavy use
 * @param {string} type - Connection type
 * @param {Object} details - Connection details
 * @returns {boolean}
 */
export const isFastConnection = (type, details) => {
  if (type === 'wifi' || type === 'ethernet') {
    return true;
  }

  if (type === 'cellular' && details?.cellularGeneration) {
    return details.cellularGeneration === '4g' || details.cellularGeneration === '5g';
  }

  return false;
};

// ============================================
// 📤 EXPORTS
// ============================================

export default NetworkContext;

// ============================================
// 📖 USAGE EXAMPLES
// ============================================

/**
 * EXAMPLE 1: Basic usage in a component
 * 
 * import { useNetwork } from './context/NetworkContext';
 * 
 * function MyScreen() {
 *   const { isConnected, connectionType } = useNetwork();
 * 
 *   if (!isConnected) {
 *     return <OfflineScreen />;
 *   }
 * 
 *   return <View>...</View>;
 * }
 */

/**
 * EXAMPLE 2: Setup in App.js
 * 
 * import { NetworkProvider } from './src/context/NetworkContext';
 * 
 * export default function App() {
 *   return (
 *     <NetworkProvider showAlerts={true}>
 *       <AuthProvider>
 *         <NavigationContainer>
 *           <AppNavigator />
 *         </NavigationContainer>
 *       </AuthProvider>
 *     </NetworkProvider>
 *   );
 * }
 */

/**
 * EXAMPLE 3: Conditional API calls
 * 
 * import { useNetwork } from './context/NetworkContext';
 * 
 * function DataFetcher() {
 *   const { isInternetReachable, refreshNetworkStatus } = useNetwork();
 * 
 *   const fetchData = async () => {
 *     if (!isInternetReachable) {
 *       Alert.alert('Error', 'No hay conexión a internet');
 *       return;
 *     }
 * 
 *     try {
 *       const data = await api.get('/data');
 *       // ...
 *     } catch (error) {
 *       // Refresh network status on error
 *       await refreshNetworkStatus();
 *     }
 *   };
 * 
 *   return <Button onPress={fetchData} title="Cargar datos" />;
 * }
 */

/**
 * EXAMPLE 4: Show connection quality indicator
 * 
 * import { useNetwork, getConnectionTypeName, isFastConnection } from './context/NetworkContext';
 * 
 * function ConnectionIndicator() {
 *   const { connectionType, connectionDetails, isConnected } = useNetwork();
 * 
 *   if (!isConnected) {
 *     return <Text style={styles.offline}>📡 Sin conexión</Text>;
 *   }
 * 
 *   const isFast = isFastConnection(connectionType, connectionDetails);
 *   const typeName = getConnectionTypeName(connectionType);
 * 
 *   return (
 *     <Text style={isFast ? styles.fast : styles.slow}>
 *       {isFast ? '🚀' : '🐌'} {typeName}
 *     </Text>
 *   );
 * }
 */

/**
 * EXAMPLE 5: Using HOC for protected screens
 * 
 * import { withNetworkCheck } from './context/NetworkContext';
 * 
 * function MapScreen() {
 *   return <MapView {...} />;  // Requires internet
 * }
 * 
 * function OfflineMapScreen() {
 *   return (
 *     <View>
 *       <Text>Esta funcionalidad requiere internet</Text>
 *       <Button title="Reintentar" onPress={() => {}} />
 *     </View>
 *   );
 * }
 * 
 * export default withNetworkCheck(MapScreen, OfflineMapScreen);
 */
