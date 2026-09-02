import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import * as Location from 'expo-location';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation debe ser usado dentro de LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [permissionGranted, setPermissionGranted] = useState(false);
  const watchRef = useRef(null);

  useEffect(() => {
    requestPermission();
    return () => {
      if (watchRef.current) {
        watchRef.current.remove();
      }
    };
  }, []);

  const requestPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permiso de ubicación denegado');
        setPermissionGranted(false);
        return false;
      }
      setPermissionGranted(true);
      setErrorMsg(null);
      await getCurrentLocation();
      return true;
    } catch (error) {
      setErrorMsg('Error al solicitar permisos de ubicación');
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setLocation({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      });
      return loc.coords;
    } catch (error) {
      setErrorMsg('No se pudo obtener la ubicación');
      return null;
    }
  };

  const startWatching = async () => {
    if (!permissionGranted) {
      const granted = await requestPermission();
      if (!granted) return;
    }
    if (watchRef.current) return; // Already watching

    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 50, // meters
        timeInterval: 10000,  // ms
      },
      (loc) => {
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
      }
    );
  };

  const stopWatching = () => {
    if (watchRef.current) {
      watchRef.current.remove();
      watchRef.current = null;
    }
  };

  const value = {
    location,
    errorMsg,
    permissionGranted,
    getCurrentLocation,
    startWatching,
    stopWatching,
    requestPermission,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
