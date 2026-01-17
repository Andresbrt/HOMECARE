import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { NavHeader, Button, Card } from '../../components';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { requestService } from '../../services/requestService';
import io from 'socket.io-client';

/**
 * PANTALLA DE SEGUIMIENTO EN TIEMPO REAL
 * Integrada con WebSockets para actualizaciones en vivo
 */
const RealTimeTrackingScreen = ({ navigation, route }) => {
  const { requestId } = route.params || {};
  const { user, token } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState(null);
  const [providerLocation, setProviderLocation] = useState(null);
  const [clientLocation, setClientLocation] = useState(null);
  const [isProviderOnWay, setIsProviderOnWay] = useState(false);
  const [estimatedArrival, setEstimatedArrival] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isLiveTracking, setIsLiveTracking] = useState(true);
  const [route, setRoute] = useState(null);

  // Configuración inicial del mapa
  const [mapRegion, setMapRegion] = useState({
    latitude: 4.7110,
    longitude: -74.0721,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });

  useEffect(() => {
    if (requestId) {
      initializeTracking();
    }
    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [requestId]);

  const initializeTracking = async () => {
    setLoading(true);
    try {
      // Cargar datos de la solicitud
      const request = await requestService.getRequestById(requestId);
      setRequestData(request);
      
      if (request.clientLocation) {
        setClientLocation({
          latitude: request.clientLocation.latitude,
          longitude: request.clientLocation.longitude,
        });
      }

      // Inicializar WebSocket para seguimiento en tiempo real
      initializeWebSocket();

    } catch (error) {
      console.error('Error initializing tracking:', error);
      Alert.alert('Error', 'No se pudo inicializar el seguimiento');
    } finally {
      setLoading(false);
    }
  };

  const initializeWebSocket = () => {
    const wsSocket = io('ws://localhost:8080', {
      auth: {
        token: token,
      },
      transports: ['websocket'],
    });

    wsSocket.on('connect', () => {
      console.log('Connected to tracking websocket');
      // Unirse al canal de seguimiento de esta solicitud
      wsSocket.emit('join-tracking', { requestId });
    });

    wsSocket.on('location-update', (data) => {
      if (data.requestId === requestId) {
        setProviderLocation({
          latitude: data.latitude,
          longitude: data.longitude,
        });
        
        if (data.isOnWay !== undefined) {
          setIsProviderOnWay(data.isOnWay);
        }
        
        if (data.estimatedArrival) {
          setEstimatedArrival(data.estimatedArrival);
        }

        // Actualizar región del mapa para mostrar ambas ubicaciones
        updateMapRegion(
          { latitude: data.latitude, longitude: data.longitude },
          clientLocation
        );
      }
    });

    wsSocket.on('service-status-update', (data) => {
      if (data.requestId === requestId) {
        setRequestData(prev => ({
          ...prev,
          status: data.status,
          statusLabel: data.statusLabel
        }));
      }
    });

    wsSocket.on('route-update', (data) => {
      if (data.requestId === requestId && data.route) {
        setRoute(data.route);
      }
    });

    wsSocket.on('disconnect', () => {
      console.log('Disconnected from tracking websocket');
    });

    wsSocket.on('error', (error) => {
      console.error('WebSocket error:', error);
    });

    setSocket(wsSocket);
  };

  const updateMapRegion = (providerLoc, clientLoc) => {
    if (!providerLoc || !clientLoc) return;

    const latitudes = [providerLoc.latitude, clientLoc.latitude];
    const longitudes = [providerLoc.longitude, clientLoc.longitude];

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const latDelta = (maxLat - minLat) * 1.5;
    const lngDelta = (maxLng - minLng) * 1.5;

    setMapRegion({
      latitude: (minLat + maxLat) / 2,
      longitude: (minLng + maxLng) / 2,
      latitudeDelta: Math.max(latDelta, 0.01),
      longitudeDelta: Math.max(lngDelta, 0.01),
    });
  };

  const toggleLiveTracking = () => {
    setIsLiveTracking(!isLiveTracking);
    if (socket) {
      if (!isLiveTracking) {
        socket.emit('join-tracking', { requestId });
      } else {
        socket.emit('leave-tracking', { requestId });
      }
    }
  };

  const handleCallProvider = () => {
    if (requestData?.providerPhone) {
      Alert.alert(
        'Llamar al Proveedor',
        `¿Deseas llamar a ${requestData.providerName}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Llamar',
            onPress: () => {
              // Aquí integrarías con react-native-communications para llamar
              console.log('Calling:', requestData.providerPhone);
            }
          }
        ]
      );
    }
  };

  const formatEstimatedTime = (arrival) => {
    if (!arrival) return 'Calculando...';
    
    const now = new Date();
    const arrivalTime = new Date(arrival);
    const diffMinutes = Math.ceil((arrivalTime - now) / (1000 * 60));
    
    if (diffMinutes <= 0) return 'Llegando ahora';
    if (diffMinutes < 60) return `${diffMinutes} min`;
    
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'EN_PROGRESO': COLORS.WARNING,
      'COMPLETADA': COLORS.SUCCESS,
      'CANCELADA': COLORS.ERROR,
    };
    return colors[status] || COLORS.SECONDARY;
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <NavHeader
          title="Seguimiento en Tiempo Real"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.loadingText}>Iniciando seguimiento...</Text>
        </View>
      </View>
    );
  }

  if (!requestData) {
    return (
      <View style={styles.container}>
        <NavHeader
          title="Seguimiento en Tiempo Real"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>No se encontró la solicitud</Text>
          <Button title="Volver" onPress={() => navigation.goBack()} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavHeader
        title="Seguimiento en Tiempo Real"
        onBack={() => navigation.goBack()}
        rightComponent={
          <View style={styles.trackingToggle}>
            <Switch
              value={isLiveTracking}
              onValueChange={toggleLiveTracking}
              trackColor={{ false: COLORS.GRAY_LIGHT, true: COLORS.PRIMARY }}
              thumbColor={isLiveTracking ? COLORS.WHITE : COLORS.GRAY_DARK}
            />
          </View>
        }
      />

      {/* Mapa */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          region={mapRegion}
          provider={PROVIDER_GOOGLE}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsTraffic={true}
          onRegionChangeComplete={setMapRegion}
        >
          {/* Marcador del cliente */}
          {clientLocation && (
            <Marker
              coordinate={clientLocation}
              title="Tu ubicación"
              description="Aquí es donde se realizará el servicio"
              pinColor={COLORS.PRIMARY}
            />
          )}
          
          {/* Marcador del proveedor */}
          {providerLocation && (
            <Marker
              coordinate={providerLocation}
              title={requestData.providerName || 'Proveedor'}
              description={isProviderOnWay ? 'En camino' : 'Ubicación actual'}
              pinColor={COLORS.SECONDARY}
            />
          )}
          
          {/* Ruta entre ubicaciones */}
          {route && (
            <Polyline
              coordinates={route}
              strokeColor={COLORS.PRIMARY}
              strokeWidth={3}
              geodesic={true}
            />
          )}
        </MapView>

        {/* Indicador de seguimiento activo */}
        {isLiveTracking && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveCircle} />
            <Text style={styles.liveText}>EN VIVO</Text>
          </View>
        )}
      </View>

      {/* Panel de información */}
      <View style={styles.infoPanel}>
        <Card style={styles.infoCard}>
          <View style={styles.serviceHeader}>
            <View style={styles.serviceInfo}>
              <Text style={styles.serviceTitle}>{requestData.title}</Text>
              <Text style={styles.providerName}>{requestData.providerName}</Text>
            </View>
            
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(requestData.status) }
            ]}>
              <Text style={styles.statusText}>{requestData.statusLabel}</Text>
            </View>
          </View>

          {/* Estado del servicio */}
          <View style={styles.trackingInfo}>
            {isProviderOnWay ? (
              <View style={styles.trackingRow}>
                <Text style={styles.trackingIcon}>🚗</Text>
                <View style={styles.trackingTextContainer}>
                  <Text style={styles.trackingTitle}>Proveedor en camino</Text>
                  <Text style={styles.trackingSubtitle}>
                    Llegada estimada: {formatEstimatedTime(estimatedArrival)}
                  </Text>
                </View>
              </View>
            ) : requestData.status === 'EN_PROGRESO' ? (
              <View style={styles.trackingRow}>
                <Text style={styles.trackingIcon}>🧹</Text>
                <View style={styles.trackingTextContainer}>
                  <Text style={styles.trackingTitle}>Servicio en progreso</Text>
                  <Text style={styles.trackingSubtitle}>El proveedor está en tu ubicación</Text>
                </View>
              </View>
            ) : (
              <View style={styles.trackingRow}>
                <Text style={styles.trackingIcon}>⏱️</Text>
                <View style={styles.trackingTextContainer}>
                  <Text style={styles.trackingTitle}>Preparándose</Text>
                  <Text style={styles.trackingSubtitle}>El proveedor se está dirigiendo hacia ti</Text>
                </View>
              </View>
            )}
          </View>

          {/* Acciones */}
          <View style={styles.actionsContainer}>
            <Button
              title="Llamar Proveedor"
              variant="outline"
              size="small"
              onPress={handleCallProvider}
              style={styles.actionButton}
            />
            
            <Button
              title="Enviar Mensaje"
              variant="outline"
              size="small"
              onPress={() => {/* Implementar chat */}}
              style={styles.actionButton}
            />
          </View>

          {/* Información adicional */}
          <View style={styles.additionalInfo}>
            <Text style={styles.infoLabel}>📅 Fecha programada:</Text>
            <Text style={styles.infoValue}>{requestData.serviceDate} • {requestData.startTime}</Text>
          </View>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY_LIGHT,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    marginTop: SPACING.MD,
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.GRAY_DARK,
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
  },

  errorText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.ERROR,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },

  trackingToggle: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  mapContainer: {
    flex: 1,
    position: 'relative',
  },

  map: {
    flex: 1,
  },

  liveIndicator: {
    position: 'absolute',
    top: SPACING.MD,
    right: SPACING.MD,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.ERROR,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },

  liveCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.WHITE,
    marginRight: SPACING.XS,
  },

  liveText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    fontWeight: '600',
  },

  infoPanel: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.MD,
    paddingBottom: SPACING.LG,
  },

  infoCard: {
    marginBottom: 0,
  },

  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },

  serviceInfo: {
    flex: 1,
  },

  serviceTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },

  providerName: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.SECONDARY,
    fontWeight: '600',
  },

  statusBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    marginLeft: SPACING.SM,
  },

  statusText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.WHITE,
    fontWeight: '600',
  },

  trackingInfo: {
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
    paddingTop: SPACING.MD,
    marginBottom: SPACING.MD,
  },

  trackingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  trackingIcon: {
    fontSize: 24,
    marginRight: SPACING.MD,
  },

  trackingTextContainer: {
    flex: 1,
  },

  trackingTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },

  trackingSubtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
  },

  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
    paddingTop: SPACING.MD,
    marginBottom: SPACING.MD,
  },

  actionButton: {
    flex: 1,
    marginHorizontal: SPACING.XS,
  },

  additionalInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
  },

  infoLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
  },

  infoValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    fontWeight: '500',
  },
});

export default RealTimeTrackingScreen;