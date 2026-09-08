import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Modal,
} from 'react-native';

let MapView, Marker, PROVIDER_GOOGLE;
if (Platform.OS !== 'web') {
  const MapModule = require('react-native-maps');
  MapView = MapModule.default;
  Marker = MapModule.Marker;
  PROVIDER_GOOGLE = MapModule.PROVIDER_GOOGLE;
} else {
  // Mock para Web
  MapView = ({ children, style }) => <View style={[style, { backgroundColor: '#0a1628', justifyContent: 'center', alignItems: 'center' }]}><Text style={{color: '#49C0BC'}}>Mapa (Solo Móvil)</Text>{children}</View>;
  Marker = ({ children }) => <View>{children}</View>;
  PROVIDER_GOOGLE = 'google';
}

import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useLocation } from '../../context/LocationContext';
import apiClient from '../../services/apiClient';
import { inicializarChat, buildChatId } from '../../services/chatService';
import { searchMedellinAddresses } from '../../services/addressAutocompleteService';
import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, BORDER_RADIUS, PROF } from '../../constants/theme';

// Solo loguear en desarrollo — no-op en producción
const __DEV_LOG__ = __DEV__
  ? (...args) => console.warn(...args)
  : () => {};

const TIPOS_PROPIEDAD = [
  { id: 'APARTAMENTO', label: 'Apartamento', icon: 'office-building-outline', defaultM2: 60 },
  { id: 'CASA',        label: 'Casa',        icon: 'home-outline',            defaultM2: 100 },
];

const SERVICIOS = [
  { id: 'general', label: 'Limpieza\nGeneral',  tipo: 'BASICA',   icon: 'sparkles-outline' },
  { id: 'premium', label: 'Limpieza\nPremium',  tipo: 'PROFUNDA', icon: 'diamond-outline'  },
  { id: 'horas',   label: 'Por\nHoras',          tipo: 'BASICA',   icon: 'time-outline'     },
];

export default function CreateRequestScreen({ navigation, route }) {
  const { location } = useLocation();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    servicioId: 'general',
    titulo: '',
    descripcion: '',
    tipoLimpieza: 'BASICA',
    ciudad: 'Medellín',
    barrio: '',
    direccion: '',
    tipoPropiedad: 'APARTAMENTO',
    metrosCuadrados: '60',
    cantidadHabitaciones: '2',
    cantidadBanos: '1',
    tieneMascotas: false,
    precioMaximo: '',
    cantidadHoras: '2',
    precioPorHora: '',
    fechaServicio: new Date().toISOString().split('T')[0],
    horaInicio: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
    duracionEstimada: '60',
    instruccionesEspeciales: '',
  });

  const selectedService = route.params?.service;

  useEffect(() => {
    if (selectedService) {
      const tipoMapeado = selectedService.tipoLimpieza ||
                         (selectedService.title?.toUpperCase().includes('BÁSICA')    ? 'BASICA'    :
                          selectedService.title?.toUpperCase().includes('PROFUNDA')  ? 'PROFUNDA'  : 'BASICA');
      const tituloNorm = (selectedService.titulo || selectedService.title || '').toLowerCase();
      const esHoras = tituloNorm.includes('hora') || selectedService.esPorHoras;
      const sid = esHoras ? 'horas'
                : tipoMapeado === 'PROFUNDA' ? 'premium' : 'general';

      setForm(prev => ({
        ...prev,
        servicioId:  sid,
        tipoLimpieza: tipoMapeado,
        titulo: selectedService.titulo || `Solicitud de ${selectedService.title || ''}`,
      }));
    }
  }, [selectedService]);

  const [isConfirmingLocation, setIsConfirmingLocation] = useState(false);
  const [geocodedCoords, setGeocodedCoords] = useState(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [isSearchingSuggestions, setIsSearchingSuggestions] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Inicializar automáticamente con la posición del contexto de ubicación y reverse geocode
  useEffect(() => {
    const coords = location?.coords || (location?.latitude ? location : null);
    if (coords?.latitude && coords?.longitude && !geocodedCoords) {
      const parsedCoords = {
        latitude: parseFloat(coords.latitude.toFixed(6)),
        longitude: parseFloat(coords.longitude.toFixed(6)),
      };
      setGeocodedCoords(parsedCoords);

      Location.reverseGeocodeAsync(parsedCoords)
        .then(rev => {
          if (rev && rev.length > 0) {
            const p = rev[0];
            const ciudadDet = p.city || p.subregion || p.region || 'Medellín';
            const barrioDet = p.district || p.subregion || '';
            const dirDet = [p.street, p.streetNumber].filter(Boolean).join(' ') || p.name || '';
            setForm(prev => ({
              ...prev,
              ciudad: prev.ciudad || ciudadDet,
              barrio: prev.barrio || barrioDet,
              direccion: prev.direccion || dirDet || `GPS (${parsedCoords.latitude}, ${parsedCoords.longitude})`,
            }));
          }
        })
        .catch(() => {
          setForm(prev => ({
            ...prev,
            ciudad: prev.ciudad || 'Medellín',
            direccion: prev.direccion || `GPS (${parsedCoords.latitude}, ${parsedCoords.longitude})`,
          }));
        });
    }
  }, [location]);

  const useCurrentPhoneLocation = async (silent = false) => {
    setIsLocating(true);
    try {
      if (!silent) Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!silent) Alert.alert('Permiso necesario', 'Debes permitir el acceso a tu ubicación para obtener las coordenadas de tu celular.');
        return;
      }

      // 1. Obtener coordenadas reales del GPS del celular
      let pos = await Location.getLastKnownPositionAsync({});
      if (!pos || !pos.coords) {
        pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      }

      if (pos && pos.coords) {
        const { latitude, longitude } = pos.coords;
        const coords = {
          latitude: parseFloat(latitude.toFixed(6)),
          longitude: parseFloat(longitude.toFixed(6)),
        };
        setGeocodedCoords(coords);

        // 2. Reverse geocoding para rellenar dirección y ciudad automáticamente
        try {
          const rev = await Location.reverseGeocodeAsync(coords);
          if (rev && rev.length > 0) {
            const p = rev[0];
            const ciudadDet = p.city || p.subregion || p.region || 'Medellín';
            const barrioDet = p.district || p.subregion || '';
            const dirDet = [p.street, p.streetNumber].filter(Boolean).join(' ') || p.name || '';
            setForm(prev => ({
              ...prev,
              ciudad: ciudadDet,
              barrio: barrioDet || prev.barrio,
              direccion: dirDet || prev.direccion || `GPS: ${coords.latitude}, ${coords.longitude}`,
            }));
          }
        } catch (revErr) {
          if (!form.direccion) {
            setForm(prev => ({ ...prev, direccion: `GPS (${coords.latitude}, ${coords.longitude})` }));
          }
        }

        if (!silent) {
          Alert.alert(
            '📍 GPS Capturado',
            `Se capturó la ubicación exacta de tu celular:\nLat: ${coords.latitude}\nLng: ${coords.longitude}`
          );
        }
      }
    } catch (err) {
      console.warn('⚠️ Error obteniendo GPS:', err);
      if (!silent) {
        Alert.alert('Error GPS', 'No se pudo leer la ubicación del celular. Verifica que el GPS esté activo.');
      }
    } finally {
      setIsLocating(false);
    }
  };

  const geocodeAddress = async () => {
    if (!form.direccion.trim() || !form.ciudad.trim()) return;
    setIsGeocoding(true);
    try {
      const ciudadLimpia = form.ciudad.trim() || 'Medellín';
      const fullAddress = `${form.direccion.trim()}, ${form.barrio.trim() ? form.barrio.trim() + ', ' : ''}${ciudadLimpia}, Antioquia, Colombia`;
      const results = await Location.geocodeAsync(fullAddress);
      if (results && results.length > 0) {
        let lat = parseFloat(results[0].latitude.toFixed(6));
        let lng = parseFloat(results[0].longitude.toFixed(6));

        // Si la búsqueda devolvió Bogotá (lat < 5.5 o lng > -74.8) pero la ciudad es Medellín, forzar Medellín
        if (ciudadLimpia.toLowerCase().includes('medell') && (lat < 5.5 || lng > -74.8)) {
          lat = 6.2442;
          lng = -75.5812;
        }

        setGeocodedCoords({
          latitude: lat,
          longitude: lng,
        });
      }
    } catch (_) {
      // silently fail — GPS coords will be used as fallback
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleDireccionChange = (text) => {
    updateField('direccion', text);
    setGeocodedCoords(null);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!text || text.trim().length < 3) {
      setSuggestions([]);
      setIsSearchingSuggestions(false);
      return;
    }

    setIsSearchingSuggestions(true);
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await searchMedellinAddresses(text);
        setSuggestions(results);
      } catch (err) {
        setSuggestions([]);
      } finally {
        setIsSearchingSuggestions(false);
      }
    }, 320);
  };

  const handleSelectSuggestion = (item) => {
    Haptics.selectionAsync();
    setForm(prev => ({
      ...prev,
      direccion: item.primaryText,
      barrio: item.barrio || prev.barrio,
      ciudad: item.ciudad || 'Medellín',
    }));
    setGeocodedCoords({
      latitude: item.latitude,
      longitude: item.longitude,
    });
    setSuggestions([]);
  };

  const clearDireccion = () => {
    updateField('direccion', '');
    setSuggestions([]);
    setGeocodedCoords(null);
  };

  const updateField = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    // 1. Tipo de servicio: si no hay ninguno seleccionado, asignar 'general' por defecto
    let currentServicioId = form.servicioId || 'general';
    let currentTipoLimpieza = form.tipoLimpieza || 'BASICA';
    if (!form.servicioId) {
      updateField('servicioId', 'general');
      updateField('tipoLimpieza', 'BASICA');
    }

    // 2. Título: si el usuario no escribió título, auto-generar uno claro y descriptivo
    let currentTitulo = form.titulo.trim();
    if (!currentTitulo) {
      const propLabel = form.tipoPropiedad === 'CASA' ? 'Casa' : 'Apartamento';
      currentTitulo = `Limpieza ${propLabel} (${form.cantidadHabitaciones || 2} hab, ${form.cantidadBanos || 1} bñ)`;
      updateField('titulo', currentTitulo);
    }

    // 3. Ciudad: si está vacía, asignar 'Medellín' por defecto
    let currentCiudad = form.ciudad.trim();
    if (!currentCiudad) {
      currentCiudad = 'Medellín';
      updateField('ciudad', 'Medellín');
    }

    // 4. Dirección: si está vacía, usar GPS o pedir solo la dirección específicamente
    let currentDireccion = form.direccion.trim();
    if (!currentDireccion) {
      if (geocodedCoords?.latitude && geocodedCoords?.longitude) {
        currentDireccion = `Ubicación GPS (${geocodedCoords.latitude.toFixed(4)}, ${geocodedCoords.longitude.toFixed(4)})`;
        updateField('direccion', currentDireccion);
      } else if (location?.coords?.latitude && location?.coords?.longitude) {
        currentDireccion = `Ubicación GPS (${location.coords.latitude.toFixed(4)}, ${location.coords.longitude.toFixed(4)})`;
        updateField('direccion', currentDireccion);
      } else {
        Alert.alert(
          'Dirección requerida',
          'Por favor escribe la dirección de tu domicilio o toca "📍 Usar ubicación GPS de mi celular" para detectarla automáticamente.',
          [
            { text: '📍 Usar GPS', onPress: () => useCurrentPhoneLocation(false) },
            { text: 'Escribir dirección', style: 'cancel' }
          ]
        );
        return;
      }
    }

    if (currentServicioId === 'horas') {
      if (!form.cantidadHoras || !form.precioPorHora) {
        Alert.alert('Campos requeridos', 'Ingresa la cantidad de horas y el valor por hora.');
        return;
      }
      const total = parseInt(form.cantidadHoras || 0) * parseInt(form.precioPorHora || 0);
      if (total < 80000) {
        Alert.alert('Precio mínimo', 'El total del servicio debe ser de mínimo COL$ 80.000.');
        return;
      }
    } else {
      const precio = form.precioMaximo ? parseFloat(form.precioMaximo) : 0;
      if (precio < 80000) {
        Alert.alert('Precio mínimo', 'El presupuesto mínimo para una solicitud es de COL$ 80.000.');
        return;
      }
    }

    setIsConfirmingLocation(true);
  };

  const executeRequest = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    setIsConfirmingLocation(false);

    try {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 10 * 60000); 
      
      const esHoras = form.servicioId === 'horas';
      const precioFinal = esHoras
        ? parseInt(form.cantidadHoras || 2) * parseInt(form.precioPorHora || 0)
        : parseFloat(form.precioMaximo);
      const duracion = esHoras
        ? parseInt(form.cantidadHoras || 2) * 60
        : (parseInt(form.duracionEstimada, 10) || 60);

      // Asegurar fecha futura (mañana) para cumplir validación @Future del backend
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const fechaServicioStr = tomorrow.toISOString().split('T')[0];

      // 1. Prioridad: Coordenadas GPS del celular (geocodedCoords o location del celular)
      let resolvedLat = geocodedCoords?.latitude;
      let resolvedLng = geocodedCoords?.longitude;

      if (!resolvedLat || !resolvedLng) {
        if (location?.coords?.latitude && location?.coords?.longitude) {
          resolvedLat = location.coords.latitude;
          resolvedLng = location.coords.longitude;
        } else if (location?.latitude && location?.longitude) {
          resolvedLat = location.latitude;
          resolvedLng = location.longitude;
        }
      }

      // 2. Fallback garantizado en Medellín
      const ciudadText = `${form.ciudad || ''} ${form.direccion || ''}`.toLowerCase();
      if (!resolvedLat || !resolvedLng) {
        if (ciudadText.includes('cali')) {
          resolvedLat = 3.4516;
          resolvedLng = -76.5320;
        } else if (ciudadText.includes('bogot')) {
          resolvedLat = 4.6768;
          resolvedLng = -74.0483;
        } else {
          // Por defecto Medellín (Centro / Laureles / Poblado)
          resolvedLat = 6.2442;
          resolvedLng = -75.5812;
        }
      }

      // Si la ciudad es Medellín pero las coordenadas quedaron en Bogotá (error de geocoder), corregir a Medellín
      if ((!ciudadText || ciudadText.includes('medell') || ciudadText.includes('antioquia')) && resolvedLat < 5.5) {
        resolvedLat = 6.2442;
        resolvedLng = -75.5812;
      }

      const finalLat = parseFloat(Number(resolvedLat).toFixed(6));
      const finalLng = parseFloat(Number(resolvedLng).toFixed(6));

      if (__DEV__) {
        console.log('📍 [CreateRequest] Coordenadas finales enviadas al backend:', finalLat, finalLng);
      }

      const payload = {
        titulo: form.titulo.trim() || 'Servicio de Limpieza',
        descripcion: form.descripcion.trim() || `Servicio de ${form.tipoLimpieza || 'Limpieza General'}`,
        tipoLimpieza: form.tipoLimpieza || 'BASICA',
        direccion: [form.direccion.trim(), form.barrio.trim(), form.ciudad.trim()].filter(Boolean).join(', ') || 'Medellín, Colombia',
        latitud: finalLat,
        longitud: finalLng,
        metrosCuadrados: form.metrosCuadrados ? parseFloat(form.metrosCuadrados) : (form.tipoPropiedad === 'CASA' ? 100 : 60),
        cantidadHabitaciones: form.cantidadHabitaciones ? parseInt(form.cantidadHabitaciones, 10) : 2,
        cantidadBanos: form.cantidadBanos ? parseInt(form.cantidadBanos, 10) : 1,
        tieneMascotas: form.tieneMascotas,
        precioMaximo: precioFinal,
        fechaServicio: fechaServicioStr,
        horaInicio: futureDate.toTimeString().split(' ')[0].substring(0, 5),
        duracionEstimada: duracion,
        instruccionesEspeciales: esHoras
          ? `[${form.tipoPropiedad}] Servicio por horas: ${form.cantidadHoras}h × $${parseInt(form.precioPorHora).toLocaleString('es-CO')}/h. ${form.instruccionesEspeciales?.trim() || ''}`.trim()
          : `[${form.tipoPropiedad}] ${form.instruccionesEspeciales?.trim() || 'Sin instrucciones adicionales'}`.trim(),
      };

      // 1. Crear solicitud en el backend REST
      const { data: solicitudCreada } = await apiClient.post('/solicitudes', payload);
      const solicitudId = solicitudCreada?.id || solicitudCreada?.solicitudId;

      // 2. Crear documento de chat en Firestore (estado "pending")
      //    Lo hacemos en background — no bloquea la navegación
      if (solicitudId && user?.id) {
        inicializarChat({
          solicitudId,
          usuarioId: user.id,
          tituloServicio: form.titulo.trim() || 'Servicio de Limpieza',
        }).catch((e) => __DEV_LOG__('[CreateRequest] inicializarChat error:', e.message));
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // 3. Navegar a la pantalla de ofertas recibidas (espera de propuestas estilo InDriver)
      if (solicitudId) {
        navigation.replace('ViewOffers', {
          solicitudId,
        });
      } else {
        // Fallback si el backend no devuelve el ID
        navigation.goBack();
      }
    } catch (error) {
      const resData = error.response?.data;
      let msg = resData?.message || resData?.mensaje;
      if (!msg && resData?.fieldErrors && typeof resData.fieldErrors === 'object') {
        msg = Object.entries(resData.fieldErrors).map(([k, v]) => `${k}: ${v}`).join('\n');
      }
      if (!msg && resData?.error) {
        msg = resData.error;
      }
      Alert.alert('Error al crear solicitud', msg || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={24} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Nueva Solicitud</Text>
            <View style={{ width: 24 }} />
          </View>

          {/* Tipo de servicio */}
          <Text style={styles.label}>Tipo de servicio *</Text>
          <View style={styles.tipoGrid}>
            {SERVICIOS.map(s => (
              <TouchableOpacity
                key={s.id}
                style={[styles.tipoCard, form.servicioId === s.id && styles.tipoCardActive]}
                onPress={() => {
                  updateField('servicioId', s.id);
                  updateField('tipoLimpieza', s.tipo);
                  Haptics.selectionAsync();
                }}
              >
                <Ionicons
                  name={s.icon}
                  size={24}
                  color={form.servicioId === s.id ? COLORS.white : COLORS.accent}
                />
                <Text style={[styles.tipoLabel, form.servicioId === s.id && styles.tipoLabelActive]}>
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Campos extra: Por Horas */}
          {form.servicioId === 'horas' && (
            <>
              <Text style={styles.sectionTitle}>Detalle del servicio por horas</Text>
              <View style={styles.row}>
                <View style={styles.halfField}>
                  <Text style={styles.miniLabel}>Número de horas *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="2"
                    placeholderTextColor={COLORS.textDisabled}
                    value={form.cantidadHoras}
                    onChangeText={v => updateField('cantidadHoras', v)}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.halfField}>
                  <Text style={styles.miniLabel}>Valor por hora (COP) *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="Ej: 25000"
                    placeholderTextColor={COLORS.textDisabled}
                    value={form.precioPorHora}
                    onChangeText={v => updateField('precioPorHora', v)}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              {!!form.cantidadHoras && !!form.precioPorHora && (
                <View style={styles.totalRow}>
                  <Ionicons name="calculator-outline" size={15} color={COLORS.accent} />
                  <Text style={styles.totalText}>
                    Total estimado:{' '}
                    <Text style={styles.totalAmount}>
                      ${(parseInt(form.cantidadHoras || 0) * parseInt(form.precioPorHora || 0)).toLocaleString('es-CO')} COP
                    </Text>
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Título */}
          <Text style={styles.label}>Título *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Limpieza apartamento 2 habitaciones"
            placeholderTextColor={COLORS.textDisabled}
            value={form.titulo}
            onChangeText={v => updateField('titulo', v)}
            maxLength={200}
          />

          {/* Descripcion */}
          <Text style={styles.label}>Descripción</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Describe lo que necesitas..."
            placeholderTextColor={COLORS.textDisabled}
            value={form.descripcion}
            onChangeText={v => updateField('descripcion', v)}
            multiline
            numberOfLines={3}
          />

          {/* Dirección */}
          <View style={styles.gpsSection}>
            <TouchableOpacity
              style={[styles.gpsButton, isLocating && styles.gpsButtonLoading]}
              onPress={() => useCurrentPhoneLocation(false)}
              disabled={isLocating}
              activeOpacity={0.85}
            >
              {isLocating ? (
                <>
                  <ActivityIndicator size="small" color="#001B38" />
                  <Text style={styles.gpsButtonText}>Obteniendo GPS de tu celular...</Text>
                </>
              ) : (
                <>
                  <Ionicons name="navigate-circle" size={22} color="#001B38" />
                  <Text style={styles.gpsButtonText}>📍 Usar ubicación GPS de mi celular</Text>
                </>
              )}
            </TouchableOpacity>

            {geocodedCoords ? (
              <View style={styles.gpsBadge}>
                <Ionicons name="checkmark-circle" size={16} color="#49C0BC" />
                <Text style={styles.gpsBadgeText}>
                  GPS activo: {geocodedCoords.latitude.toFixed(4)}, {geocodedCoords.longitude.toFixed(4)}
                </Text>
              </View>
            ) : null}
          </View>

          {/* Dirección específica y Autocompletado estilo Google Maps */}
          <Text style={styles.label}>Dirección específica en Medellín *</Text>
          <View style={styles.addressInputContainer}>
            <Ionicons name="search" size={18} color="#49C0BC" style={{ marginLeft: 12 }} />
            <TextInput
              style={styles.addressInput}
              placeholder="Escribe tu dirección (ej: Cra 75 # 96-24 o Calle 10 # 40)..."
              placeholderTextColor={COLORS.textDisabled}
              value={form.direccion}
              onChangeText={handleDireccionChange}
              onBlur={geocodeAddress}
              returnKeyType="done"
              onSubmitEditing={geocodeAddress}
            />
            {isSearchingSuggestions ? (
              <ActivityIndicator size="small" color="#49C0BC" style={{ marginRight: 12 }} />
            ) : form.direccion?.length > 0 ? (
              <TouchableOpacity onPress={clearDireccion} style={{ padding: 8, marginRight: 4 }}>
                <Ionicons name="close-circle" size={18} color="#90A4AE" />
              </TouchableOpacity>
            ) : null}
          </View>

          {/* LISTA DE SUGERENCIAS DESPLEGABLE ESTILO GOOGLE MAPS */}
          {suggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <View style={styles.suggestionsHeader}>
                <Ionicons name="compass-outline" size={14} color="#49C0BC" />
                <Text style={styles.suggestionsHeaderText}>Selecciona tu barrio en Medellín / Valle de Aburrá</Text>
              </View>
              {suggestions.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.suggestionItem}
                  onPress={() => handleSelectSuggestion(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.suggestionIconWrap}>
                    <Ionicons name="location" size={16} color="#49C0BC" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.suggestionPrimaryText} numberOfLines={1}>
                      {item.primaryText}
                    </Text>
                    <Text style={styles.suggestionSecondaryText} numberOfLines={1}>
                      {item.secondaryText}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#546E7A" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {geocodedCoords && (
            <View style={styles.verifiedAddressBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#49C0BC" />
              <Text style={styles.verifiedAddressText}>
                {form.barrio ? `${form.barrio}, ` : ''}{form.ciudad || 'Medellín'} ✓ Coordenadas fijadas ({geocodedCoords.latitude.toFixed(4)}, {geocodedCoords.longitude.toFixed(4)})
              </Text>
            </View>
          )}

          {/* Barrio y Ciudad en fila */}
          <View style={styles.row}>
            <View style={styles.halfField}>
              <Text style={styles.label}>Barrio</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Castilla, Laureles..."
                placeholderTextColor={COLORS.textDisabled}
                value={form.barrio}
                onChangeText={v => updateField('barrio', v)}
              />
            </View>
            <View style={styles.halfField}>
              <Text style={styles.label}>Ciudad *</Text>
              <TextInput
                style={styles.input}
                placeholder="Medellín"
                placeholderTextColor={COLORS.textDisabled}
                value={form.ciudad}
                onChangeText={v => updateField('ciudad', v)}
              />
            </View>
          </View>

          {/* Detalles del espacio */}
          <Text style={styles.sectionTitle}>Detalles del espacio</Text>

          {/* Tipo de propiedad */}
          <Text style={styles.label}>Tipo de propiedad</Text>
          <View style={styles.propGrid}>
            {TIPOS_PROPIEDAD.map(t => {
              const active = form.tipoPropiedad === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.propCard, active && styles.propCardActive]}
                  onPress={() => {
                    updateField('tipoPropiedad', t.id);
                    updateField('metrosCuadrados', t.defaultM2.toString());
                    Haptics.selectionAsync();
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons
                    name={t.icon}
                    size={28}
                    color={active ? COLORS.white : COLORS.accent}
                  />
                  <Text style={[styles.propLabel, active && styles.propLabelActive]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Habitaciones */}
          <Text style={styles.label}>Habitaciones</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}
            contentContainerStyle={styles.chipRow}>
            {Array.from({ length: 11 }, (_, i) => i).map(n => {
              const active = parseInt(form.cantidadHabitaciones) === n;
              return (
                <TouchableOpacity
                  key={n}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => { updateField('cantidadHabitaciones', n.toString()); Haptics.selectionAsync(); }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{n}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Baños */}
          <Text style={styles.label}>Baños</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}
            contentContainerStyle={styles.chipRow}>
            {Array.from({ length: 11 }, (_, i) => i).map(n => {
              const active = parseInt(form.cantidadBanos) === n;
              return (
                <TouchableOpacity
                  key={n}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => { updateField('cantidadBanos', n.toString()); Haptics.selectionAsync(); }}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>{n}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Mascotas toggle */}
          <TouchableOpacity
            style={styles.toggleRow}
            onPress={() => { updateField('tieneMascotas', !form.tieneMascotas); Haptics.selectionAsync(); }}
          >
            <Ionicons
              name={form.tieneMascotas ? 'checkbox' : 'square-outline'}
              size={24}
              color={form.tieneMascotas ? COLORS.accent : COLORS.textDisabled}
            />
            <Text style={styles.toggleLabel}>Tengo mascotas</Text>
          </TouchableOpacity>

          {/* Presupuesto — solo cuando NO es por horas */}
          {form.servicioId !== 'horas' && (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.miniLabel}>Presupuesto sugerido (Min. $80.000) *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: 85000"
                placeholderTextColor={COLORS.textDisabled}
                value={form.precioMaximo}
                onChangeText={v => updateField('precioMaximo', v)}
                keyboardType="numeric"
              />
            </View>
          </View>
          )}

          {/* Instrucciones */}
          <Text style={styles.label}>Instrucciones especiales</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Algo que el profesional deba saber..."
            placeholderTextColor={COLORS.textDisabled}
            value={form.instruccionesEspeciales}
            onChangeText={v => updateField('instruccionesEspeciales', v)}
            multiline
            numberOfLines={3}
          />

          {/* Submit */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.8}>
            {loading ? (
              <ActivityIndicator color={COLORS.white} />
            ) : (
              <>
                <Ionicons name="flash" size={20} color={COLORS.white} />
                <Text style={styles.submitText}>SOLICITAR OFERTAS AHORA</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL DE CONFIRMACIÓN DE UBICACIÓN */}
      <Modal visible={isConfirmingLocation} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Confirma tu ubicación</Text>
            <Text style={styles.modalSub}>El profesional llegará a este punto exacto</Text>
            
            <View style={styles.miniMapWrap}>
              <MapView
                provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                style={styles.miniMap}
                initialRegion={{
                  latitude: geocodedCoords?.latitude || location?.coords?.latitude || 6.2442,
                  longitude: geocodedCoords?.longitude || location?.coords?.longitude || -75.5812,
                  latitudeDelta: 0.005,
                  longitudeDelta: 0.005,
                }}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{
                    latitude: geocodedCoords?.latitude || location?.coords?.latitude || 6.2442,
                    longitude: geocodedCoords?.longitude || location?.coords?.longitude || -75.5812,
                  }}
                >
                  <View style={styles.markerCircle}>
                    <View style={styles.markerDot} />
                  </View>
                </Marker>
              </MapView>
            </View>

            <TouchableOpacity style={styles.confirmBtn} onPress={executeRequest}>
              <Text style={styles.confirmBtnText}>Confirmar y Publicar</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsConfirmingLocation(false)}>
              <Text style={styles.cancelBtnText}>Editar dirección</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SPACING.lg },
  headerTitle: { fontSize: TYPOGRAPHY.xl, fontWeight: TYPOGRAPHY.bold, color: COLORS.textPrimary },
  label: { fontSize: TYPOGRAPHY.sm, fontWeight: TYPOGRAPHY.semibold, color: COLORS.textPrimary, marginTop: SPACING.md, marginBottom: SPACING.xs },
  miniLabel: { fontSize: TYPOGRAPHY.xs, color: COLORS.textSecondary, marginBottom: 4 },
  sectionTitle: { fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.bold, color: COLORS.textPrimary, marginTop: SPACING.lg, marginBottom: SPACING.sm },
  input: {
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    fontSize: TYPOGRAPHY.md,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.xs },
  halfField: { flex: 1 },
  tipoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  tipoCard: {
    width: '31%',
    backgroundColor: COLORS.card,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  tipoCardActive: { backgroundColor: COLORS.accent, borderColor: COLORS.accent },
  tipoLabel: { fontSize: TYPOGRAPHY.xs, color: COLORS.textPrimary, marginTop: 4, textAlign: 'center' },
  tipoLabelActive: { color: COLORS.white, fontWeight: TYPOGRAPHY.semibold },
  // Total por horas
  totalRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: SPACING.sm, backgroundColor: 'rgba(73,192,188,0.1)', borderRadius: BORDER_RADIUS.sm, paddingVertical: 8, paddingHorizontal: 12 },
  totalText: { fontSize: TYPOGRAPHY.sm, color: COLORS.textSecondary },
  totalAmount: { fontWeight: TYPOGRAPHY.bold, color: COLORS.accent },
  toggleRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.md, gap: SPACING.sm },
  toggleLabel: { fontSize: TYPOGRAPHY.md, color: COLORS.textPrimary },
  submitBtn: {
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.xl,
    gap: SPACING.sm,
    ...SHADOWS.md,
  },
  submitText: { color: COLORS.white, fontSize: TYPOGRAPHY.lg, fontWeight: TYPOGRAPHY.bold },

  // Estilos del Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: SPACING.lg,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  miniMapWrap: {
    height: 180,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#eee',
    marginBottom: SPACING.lg,
  },
  miniMap: {
    flex: 1,
  },
  markerCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(73,192,188,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#49C0BC',
    borderWidth: 2,
    borderColor: '#fff',
  },
  confirmBtn: {
    backgroundColor: '#000',
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  confirmBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  cancelBtn: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#666',
    fontWeight: '600',
  },

  // ── Tipo de propiedad ──────────────────────────────────────────────────────
  propGrid: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  propCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundSecondary,
    gap: 6,
  },
  propCardActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  propLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  propLabelActive: {
    color: COLORS.white,
  },

  // ── Pickers de número ──────────────────────────────────────────────────────
  chipScroll: {
    marginBottom: SPACING.md,
  },
  chipRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingVertical: 4,
  },
  chip: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  chipText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  chipTextActive: {
    color: COLORS.white,
  },

  // ── GPS Celular ───────────────────────────────────────────────────────────
  gpsSection: {
    marginBottom: SPACING.md,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#49C0BC',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#49C0BC',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 3,
  },
  gpsButtonLoading: {
    opacity: 0.75,
  },
  gpsButtonText: {
    color: '#001B38',
    fontSize: 15,
    fontWeight: '700',
  },
  gpsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(73, 192, 188, 0.12)',
    borderWidth: 1,
    borderColor: '#49C0BC',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginTop: 8,
    gap: 6,
  },
  gpsBadgeText: {
    color: '#49C0BC',
    fontSize: 13,
    fontWeight: '600',
  },

  // ── Autocompletado de Direcciones ──────────────────────────────────────────
  addressInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#001B38',
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(73, 192, 188, 0.4)',
    marginBottom: 6,
  },
  addressInput: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 10,
    fontSize: 14,
    color: '#FFFFFF',
  },
  suggestionsContainer: {
    backgroundColor: '#001B38',
    borderRadius: 14,
    marginTop: 4,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(73, 192, 188, 0.45)',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 6,
  },
  suggestionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: 'rgba(73, 192, 188, 0.12)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(73, 192, 188, 0.2)',
  },
  suggestionsHeaderText: {
    fontSize: 11,
    color: '#49C0BC',
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    gap: 12,
  },
  suggestionIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(73, 192, 188, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  suggestionPrimaryText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  suggestionSecondaryText: {
    fontSize: 12,
    color: '#90A4AE',
    marginTop: 2,
  },
  verifiedAddressBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(73, 192, 188, 0.12)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#49C0BC',
    marginTop: 4,
    marginBottom: 8,
  },
  verifiedAddressText: {
    color: '#49C0BC',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});
