import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { NavHeader, Button, Card } from '../../components';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, DIMENSIONS } from '../../theme';

/**
 * PANTALLA DE SEGUIMIENTO EN TIEMPO REAL
 * Funcionalidades:
 * - Mapa con ubicación del proveedor
 * - Estado actual del servicio
 * - Tiempo estimado de llegada
 * - Chat con el proveedor
 * - Información del servicio
 */
const TrackingScreen = ({ navigation, route }) => {
  const { requestId } = route.params || {};
  const [trackingData, setTrackingData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);

  // Mock data para el seguimiento
  const mockTrackingData = {
    requestId: requestId || 'REQ-2024-001',
    status: 'EN_CAMINO',
    provider: {
      id: 'PROV-001',
      name: 'María González',
      phone: '+57 300 123 4567',
      rating: 4.8,
      avatar: null,
      location: {
        latitude: 4.7110,
        longitude: -74.0721,
      },
    },
    client: {
      location: {
        latitude: 4.6097,
        longitude: -74.0817,
      },
    },
    service: {
      type: 'Limpieza Completa del Hogar',
      scheduledTime: '2024-01-15 14:00',
      estimatedDuration: '3 horas',
      address: 'Calle 127 #15-30, Bogotá',
    },
    timeline: [
      { status: 'CONFIRMADO', time: '12:30', completed: true },
      { status: 'EN_CAMINO', time: '13:45', completed: true },
      { status: 'LLEGUE', time: '14:00', completed: false },
      { status: 'INICIADO', time: '14:05', completed: false },
      { status: 'COMPLETADO', time: '17:00', completed: false },
    ],
    estimatedArrival: '14:05',
    distance: '2.3 km',
    duration: '8 min',
  };

  useEffect(() => {
    // Simular carga de datos de seguimiento
    setTimeout(() => {
      setTrackingData(mockTrackingData);
      setLoading(false);
    }, 1000);

    // Simular actualizaciones en tiempo real
    const interval = setInterval(() => {
      // Aquí se actualizaría la ubicación del proveedor via WebSocket
      console.log('Actualizando ubicación del proveedor...');
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleCancelService = () => {
    Alert.alert(
      'Cancelar Servicio',
      '¿Estás seguro de que quieres cancelar este servicio? Esta acción no se puede deshacer.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Sí, Cancelar',
          style: 'destructive',
          onPress: () => {
            // Llamada a la API para cancelar
            console.log('Cancelando servicio...');
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleCallProvider = () => {
    // Integración con llamadas telefónicas
    Alert.alert('Llamar', `¿Deseas llamar a ${trackingData.provider.name}?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Llamar', onPress: () => console.log('Realizando llamada...') },
    ]);
  };

  const handleChatProvider = () => {
    navigation.navigate('Chat', {
      providerId: trackingData.provider.id,
      providerName: trackingData.provider.name,
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'CONFIRMADO': return COLORS.INFO;
      case 'EN_CAMINO': return COLORS.WARNING;
      case 'LLEGUE': return COLORS.PRIMARY;
      case 'INICIADO': return COLORS.SUCCESS;
      case 'COMPLETADO': return COLORS.SUCCESS;
      default: return COLORS.GRAY_DARK;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'CONFIRMADO': return 'Servicio Confirmado';
      case 'EN_CAMINO': return 'Proveedor en Camino';
      case 'LLEGUE': return 'Proveedor ha Llegado';
      case 'INICIADO': return 'Servicio en Progreso';
      case 'COMPLETADO': return 'Servicio Completado';
      default: return 'Estado Desconocido';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando información del servicio...</Text>
      </View>
    );
  }

  if (!trackingData) {
    return (
      <View style={styles.errorContainer}>
        <Text>Error al cargar los datos del seguimiento</Text>
        <Button
          title="Reintentar"
          onPress={() => setLoading(true)}
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavHeader
        title="Seguimiento de Servicio"
        onBack={() => navigation.goBack()}
        actions={
          <Button
            title="Llamar"
            onPress={handleCallProvider}
            variant="outline"
            size="small"
          />
        }
      />

      <ScrollView style={styles.content}>
        {/* Mapa de Seguimiento */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: (trackingData.provider.location.latitude + trackingData.client.location.latitude) / 2,
              longitude: (trackingData.provider.location.longitude + trackingData.client.location.longitude) / 2,
              latitudeDelta: 0.05,
              longitudeDelta: 0.05,
            }}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {/* Marcador del Proveedor */}
            <Marker
              coordinate={trackingData.provider.location}
              title={trackingData.provider.name}
              description="Proveedor de Servicio"
              pinColor={COLORS.PRIMARY}
            />

            {/* Marcador del Cliente */}
            <Marker
              coordinate={trackingData.client.location}
              title="Tu ubicación"
              description={trackingData.service.address}
              pinColor={COLORS.SUCCESS}
            />
          </MapView>
        </View>

        {/* Estado Actual */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View style={[styles.statusIndicator, { backgroundColor: getStatusColor(trackingData.status) }]} />
            <Text style={styles.statusText}>{getStatusText(trackingData.status)}</Text>
          </View>
          <Text style={styles.statusSubtext}>
            Tiempo estimado de llegada: {trackingData.estimatedArrival}
          </Text>
          <Text style={styles.statusDistance}>
            Distancia: {trackingData.distance} • Duración: {trackingData.duration}
          </Text>
        </Card>

        {/* Información del Proveedor */}
        <Card style={styles.providerCard}>
          <View style={styles.providerHeader}>
            <View style={styles.providerAvatar}>
              <Text style={styles.providerAvatarText}>
                {trackingData.provider.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.providerInfo}>
              <Text style={styles.providerName}>{trackingData.provider.name}</Text>
              <Text style={styles.providerRating}>⭐ {trackingData.provider.rating}</Text>
            </View>
          </View>
          <View style={styles.providerActions}>
            <Button
              title="Llamar"
              onPress={handleCallProvider}
              variant="outline"
              style={styles.actionButton}
            />
            <Button
              title="Chat"
              onPress={handleChatProvider}
              variant="primary"
              style={styles.actionButton}
            />
          </View>
        </Card>

        {/* Línea de Tiempo */}
        <Card style={styles.timelineCard}>
          <Text style={styles.timelineTitle}>Progreso del Servicio</Text>
          {trackingData.timeline.map((step, index) => (
            <View key={index} style={styles.timelineStep}>
              <View style={[
                styles.timelineIndicator,
                step.completed && styles.timelineIndicatorCompleted,
              ]} />
              <View style={styles.timelineContent}>
                <Text style={[
                  styles.timelineStepText,
                  step.completed && styles.timelineStepTextCompleted,
                ]}>
                  {getStatusText(step.status)}
                </Text>
                <Text style={styles.timelineStepTime}>{step.time}</Text>
              </View>
            </View>
          ))}
        </Card>

        {/* Información del Servicio */}
        <Card style={styles.serviceCard}>
          <Text style={styles.serviceTitle}>Detalles del Servicio</Text>
          <View style={styles.serviceDetail}>
            <Text style={styles.serviceDetailLabel}>Tipo:</Text>
            <Text style={styles.serviceDetailValue}>{trackingData.service.type}</Text>
          </View>
          <View style={styles.serviceDetail}>
            <Text style={styles.serviceDetailLabel}>Dirección:</Text>
            <Text style={styles.serviceDetailValue}>{trackingData.service.address}</Text>
          </View>
          <View style={styles.serviceDetail}>
            <Text style={styles.serviceDetailLabel}>Hora Programada:</Text>
            <Text style={styles.serviceDetailValue}>{trackingData.service.scheduledTime}</Text>
          </View>
          <View style={styles.serviceDetail}>
            <Text style={styles.serviceDetailLabel}>Duración Estimada:</Text>
            <Text style={styles.serviceDetailValue}>{trackingData.service.estimatedDuration}</Text>
          </View>
        </Card>

        {/* Botones de Acción */}
        <View style={styles.actionButtons}>
          {trackingData.status !== 'COMPLETADO' && trackingData.status !== 'CANCELADO' && (
            <Button
              title="Cancelar Servicio"
              onPress={handleCancelService}
              variant="danger"
              fullWidth
              style={styles.cancelButton}
            />
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  
  content: {
    flex: 1,
    paddingHorizontal: SPACING.MD,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.GRAY_LIGHT,
    padding: SPACING.LG,
  },
  
  retryButton: {
    marginTop: SPACING.MD,
  },
  
  // Mapa
  mapContainer: {
    height: 250,
    borderRadius: BORDER_RADIUS.LG,
    overflow: 'hidden',
    marginTop: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  
  // Estado
  statusCard: {
    marginBottom: SPACING.MD,
  },
  
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.SM,
  },
  
  statusText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  
  statusSubtext: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.XS,
  },
  
  statusDistance: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
  },
  
  // Proveedor
  providerCard: {
    marginBottom: SPACING.MD,
  },
  
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  
  providerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  
  providerAvatarText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  
  providerInfo: {
    flex: 1,
  },
  
  providerName: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  
  providerRating: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  providerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  actionButton: {
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
  
  // Línea de tiempo
  timelineCard: {
    marginBottom: SPACING.MD,
  },
  
  timelineTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.MD,
  },
  
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  
  timelineIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.GRAY_MEDIUM,
    marginRight: SPACING.MD,
  },
  
  timelineIndicatorCompleted: {
    backgroundColor: COLORS.SUCCESS,
  },
  
  timelineContent: {
    flex: 1,
  },
  
  timelineStepText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
  },
  
  timelineStepTextCompleted: {
    color: COLORS.DARK,
    fontWeight: '600',
  },
  
  timelineStepTime: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  // Servicio
  serviceCard: {
    marginBottom: SPACING.MD,
  },
  
  serviceTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.MD,
  },
  
  serviceDetail: {
    flexDirection: 'row',
    marginBottom: SPACING.SM,
  },
  
  serviceDetailLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    flex: 1,
  },
  
  serviceDetailValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    flex: 2,
    fontWeight: '500',
  },
  
  // Acciones
  actionButtons: {
    paddingVertical: SPACING.XL,
  },
  
  cancelButton: {
    marginTop: SPACING.MD,
  },
});

export default TrackingScreen;