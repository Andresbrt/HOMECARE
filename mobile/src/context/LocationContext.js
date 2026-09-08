import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import * as Location from 'expo-location';
import * as Device from 'expo-device';

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

  // Coordenadas base Medellín (Centro / Laureles / El Poblado)
  const MEDELLIN_COORDS = { latitude: 6.2442, longitude: -75.5812 };

  // Detecta si las coordenadas corresponden a un simulador/emulador fuera de Colombia (Cupertino o Mountain View)
  const isEmulatorOrOutsideColombia = (lat, lng) => {
    // Si es un celular físico real, NUNCA tratar como emulador
    if (Device.isDevice) return false;
    if (lat === null || lat === undefined || lng === null || lng === undefined) return true;
    // California (iOS Cupertino ~37.33, SF ~37.78, Android Mountain View ~37.42)
    const isCalifornia = lat >= 36.0 && lat <= 39.0 && lng >= -124.0 && lng <= -120.0;
    // Bounding box de Colombia: lat [-4.5, 14.0], lng [-82.0, -66.0]
    const isOutsideColombia = lat < -4.5 || lat > 14.0 || lng < -82.0 || lng > -66.0;
    return isCalifornia || isOutsideColombia;
  };

  const normalizeCoords = (rawCoords) => {
    // En celular físico real (Device.isDevice === true), SIEMPRE usar su GPS real
    if (Device.isDevice && rawCoords?.latitude && rawCoords?.longitude) {
      if (__DEV__) {
        console.log('📱 [LocationContext] GPS REAL del celular detectado:', rawCoords.latitude, rawCoords.longitude);
      }
      return { ...rawCoords, isRealGps: true };
    }

    if (!rawCoords || isEmulatorOrOutsideColombia(rawCoords.latitude, rawCoords.longitude)) {
      if (__DEV__) {
        console.log('📍 [LocationContext] Simulador/Emulador detectado. Usando coordenadas Medellín:', MEDELLIN_COORDS);
      }
      return { ...MEDELLIN_COORDS, isDemo: true };
    }
    return rawCoords;
  };

  const getCurrentLocation = async () => {
    try {
      // 1. Intentar obtener la última posición conocida (ultra rápido e infalible en celular)
      let loc = await Location.getLastKnownPositionAsync({});
      if (!loc || !loc.coords) {
        loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
      }

      if (loc && loc.coords) {
        const rawCoords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        const coords = normalizeCoords(rawCoords);
        if (__DEV__) {
          console.log('📍 [LocationContext] Coordenadas GPS activas:', coords.latitude, coords.longitude, coords.isDemo ? '(Demo Medellín)' : '(Celular Real)');
        }
        setLocation({
          ...coords,
          coords,
        });
        return coords;
      }
    } catch (error) {
      if (__DEV__) {
        console.warn('⚠️ [LocationContext] Error obteniendo GPS del celular:', error.message);
      }
    }

    // Fallback garantizado en Medellín si el hardware GPS falló o está desactivado
    const coords = { ...MEDELLIN_COORDS, isDemo: true };
    setLocation({
      ...coords,
      coords,
      isFallback: true,
    });
    return coords;
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
        const rawCoords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        const coords = normalizeCoords(rawCoords);
        setLocation({
          ...coords,
          coords,
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
