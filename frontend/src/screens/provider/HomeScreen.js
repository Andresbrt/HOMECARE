import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { MainHeader, Card, Button, RequestCard } from '../../components';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme';

/**
 * PANTALLA PRINCIPAL DEL PROVEEDOR
 * Funcionalidades:
 * - Estado online/offline
 * - Solicitudes pendientes
 * - Servicios activos
 * - Estadísticas del día
 * - Acceso rápido a funciones
 */
const ProviderHomeScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeServices, setActiveServices] = useState([]);
  const [todayStats, setTodayStats] = useState({});
  const [provider, setProvider] = useState({
    name: 'María González',
    rating: 4.8,
    completedJobs: 156,
    location: 'Bogotá Norte',
    notifications: 2,
  });

  // Mock data para solicitudes pendientes
  const mockPendingRequests = [
    {
      id: 'REQ-001',
      service: 'Limpieza Completa del Hogar',
      client: 'Carlos Méndez',
      address: 'Calle 127 #15-30, Bogotá',
      scheduledDate: '2024-01-15 14:00',
      price: 150000,
      distance: '2.3 km',
      urgency: 'normal',
      estimatedDuration: '3 horas',
    },
    {
      id: 'REQ-002',
      service: 'Limpieza de Oficina',
      client: 'Empresa ABC',
      address: 'Carrera 13 #93-40, Bogotá',
      scheduledDate: '2024-01-15 16:30',
      price: 200000,
      distance: '4.1 km',
      urgency: 'urgente',
      estimatedDuration: '2 horas',
    },
  ];

  // Mock data para servicios activos
  const mockActiveServices = [
    {
      id: 'SRV-001',
      service: 'Limpieza Post-Construcción',
      client: 'Ana Torres',
      address: 'Calle 72 #10-15, Bogotá',
      status: 'EN_PROCESO',
      startedAt: '10:30',
      estimatedEnd: '14:30',
      progress: 65,
    },
  ];

  // Mock data para estadísticas del día
  const mockTodayStats = {
    earnings: 450000,
    completedJobs: 3,
    pendingJobs: 2,
    averageRating: 4.9,
    hoursWorked: 6.5,
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setPendingRequests(mockPendingRequests);
    setActiveServices(mockActiveServices);
    setTodayStats(mockTodayStats);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      loadData();
      setRefreshing(false);
    }, 2000);
  }, []);

  const handleToggleOnline = (value) => {
    setIsOnline(value);
    // Actualizar estado en el servidor
    console.log(`Proveedor ${value ? 'online' : 'offline'}`);
  };

  const handleAcceptRequest = (requestId) => {
    Alert.alert(
      'Aceptar Solicitud',
      '¿Deseas aceptar esta solicitud de servicio?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Aceptar',
          onPress: () => {
            console.log(`Aceptando solicitud ${requestId}`);
            // Mover a servicios activos
            const request = pendingRequests.find(r => r.id === requestId);
            if (request) {
              setPendingRequests(prev => prev.filter(r => r.id !== requestId));
              navigation.navigate('ActiveService', { request });
            }
          },
        },
      ]
    );
  };

  const handleRejectRequest = (requestId) => {
    Alert.alert(
      'Rechazar Solicitud',
      '¿Estás seguro de que quieres rechazar esta solicitud?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Rechazar',
          style: 'destructive',
          onPress: () => {
            console.log(`Rechazando solicitud ${requestId}`);
            setPendingRequests(prev => prev.filter(r => r.id !== requestId));
          },
        },
      ]
    );
  };

  const handleActiveService = (service) => {
    navigation.navigate('ActiveService', { service });
  };

  const renderPendingRequest = ({ item }) => (
    <Card style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <Text style={styles.requestService}>{item.service}</Text>
        {item.urgency === 'urgente' && (
          <View style={styles.urgentBadge}>
            <Text style={styles.urgentText}>URGENTE</Text>
          </View>
        )}
      </View>
      
      <View style={styles.requestInfo}>
        <Text style={styles.requestClient}>👤 {item.client}</Text>
        <Text style={styles.requestAddress}>📍 {item.address}</Text>
        <Text style={styles.requestTime}>🕒 {item.scheduledDate}</Text>
        <Text style={styles.requestDuration}>⏱️ {item.estimatedDuration}</Text>
      </View>
      
      <View style={styles.requestFooter}>
        <View style={styles.requestDetails}>
          <Text style={styles.requestPrice}>${item.price.toLocaleString()}</Text>
          <Text style={styles.requestDistance}>{item.distance}</Text>
        </View>
        
        <View style={styles.requestActions}>
          <Button
            title="Rechazar"
            onPress={() => handleRejectRequest(item.id)}
            variant="outline"
            size="small"
            style={styles.rejectButton}
          />
          <Button
            title="Aceptar"
            onPress={() => handleAcceptRequest(item.id)}
            variant="primary"
            size="small"
            style={styles.acceptButton}
          />
        </View>
      </View>
    </Card>
  );

  const renderActiveService = ({ item }) => (
    <TouchableOpacity
      style={styles.activeServiceCard}
      onPress={() => handleActiveService(item)}
    >
      <View style={styles.activeServiceHeader}>
        <Text style={styles.activeServiceTitle}>{item.service}</Text>
        <View style={[styles.statusBadge, { backgroundColor: COLORS.SUCCESS }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      
      <Text style={styles.activeServiceClient}>Cliente: {item.client}</Text>
      <Text style={styles.activeServiceTime}>
        Inicio: {item.startedAt} • Fin estimado: {item.estimatedEnd}
      </Text>
      
      <View style={styles.progressContainer}>
        <Text style={styles.progressText}>Progreso: {item.progress}%</Text>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header Principal */}
      <MainHeader
        userName={provider.name}
        notifications={provider.notifications}
        currentLocation={provider.location}
        onProfilePress={() => navigation.navigate('ProviderProfile')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onLocationPress={() => navigation.navigate('LocationSettings')}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Estado Online/Offline */}
        <Card style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <View>
              <Text style={styles.statusTitle}>Estado del Proveedor</Text>
              <Text style={styles.statusSubtitle}>
                {isOnline ? 'Disponible para recibir solicitudes' : 'No disponible'}
              </Text>
            </View>
            <Switch
              value={isOnline}
              onValueChange={handleToggleOnline}
              trackColor={{ false: COLORS.GRAY_MEDIUM, true: COLORS.PRIMARY }}
              thumbColor={isOnline ? COLORS.WHITE : COLORS.GRAY_DARK}
            />
          </View>
          <View style={[styles.statusIndicator, { backgroundColor: isOnline ? COLORS.SUCCESS : COLORS.ERROR }]} />
        </Card>

        {/* Estadísticas del Día */}
        <Card style={styles.statsCard}>
          <Text style={styles.sectionTitle}>📊 Estadísticas de Hoy</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${todayStats.earnings?.toLocaleString()}</Text>
              <Text style={styles.statLabel}>Ganancias</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayStats.completedJobs}</Text>
              <Text style={styles.statLabel}>Completados</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{todayStats.pendingJobs}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>⭐ {todayStats.averageRating}</Text>
              <Text style={styles.statLabel}>Calificación</Text>
            </View>
          </View>
        </Card>

        {/* Servicios Activos */}
        {activeServices.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔧 Servicios Activos</Text>
            <FlatList
              data={activeServices}
              renderItem={renderActiveService}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        {/* Solicitudes Pendientes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>📋 Solicitudes Pendientes</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllRequests')}>
              <Text style={styles.seeAllText}>Ver todas</Text>
            </TouchableOpacity>
          </View>
          
          {pendingRequests.length > 0 ? (
            <FlatList
              data={pendingRequests}
              renderItem={renderPendingRequest}
              keyExtractor={(item) => item.id}
              scrollEnabled={false}
            />
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={styles.emptyText}>
                {isOnline ? 'No hay solicitudes pendientes' : 'Activa tu estado para recibir solicitudes'}
              </Text>
            </Card>
          )}
        </View>

        {/* Acciones Rápidas */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('ServiceHistory')}
          >
            <Text style={styles.quickActionIcon}>📝</Text>
            <Text style={styles.quickActionText}>Historial</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Earnings')}
          >
            <Text style={styles.quickActionIcon}>💰</Text>
            <Text style={styles.quickActionText}>Ganancias</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Schedule')}
          >
            <Text style={styles.quickActionIcon}>📅</Text>
            <Text style={styles.quickActionText}>Horarios</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('Support')}
          >
            <Text style={styles.quickActionIcon}>❓</Text>
            <Text style={styles.quickActionText}>Soporte</Text>
          </TouchableOpacity>
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
  
  // Estado
  statusCard: {
    marginTop: SPACING.LG,
    marginBottom: SPACING.MD,
  },
  
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  
  statusTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  
  statusSubtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  statusIndicator: {
    height: 4,
    borderRadius: 2,
  },
  
  // Estadísticas
  statsCard: {
    marginBottom: SPACING.MD,
  },
  
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.MD,
  },
  
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  
  statValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  
  statLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  // Secciones
  section: {
    marginBottom: SPACING.LG,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  
  sectionTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.DARK,
  },
  
  seeAllText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  
  // Solicitudes
  requestCard: {
    marginBottom: SPACING.MD,
  },
  
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  
  requestService: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
    flex: 1,
  },
  
  urgentBadge: {
    backgroundColor: COLORS.ERROR,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  
  urgentText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.WHITE,
    fontWeight: '700',
  },
  
  requestInfo: {
    marginBottom: SPACING.MD,
  },
  
  requestClient: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },
  
  requestAddress: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.XS,
  },
  
  requestTime: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.XS,
  },
  
  requestDuration: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
  },
  
  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  requestDetails: {
    flex: 1,
  },
  
  requestPrice: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  
  requestDistance: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  requestActions: {
    flexDirection: 'row',
  },
  
  rejectButton: {
    marginRight: SPACING.SM,
  },
  
  acceptButton: {
    minWidth: 80,
  },
  
  // Servicios activos
  activeServiceCard: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.SUCCESS,
  },
  
  activeServiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  
  activeServiceTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
    flex: 1,
  },
  
  statusBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  
  statusText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  
  activeServiceClient: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },
  
  activeServiceTime: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.MD,
  },
  
  progressContainer: {
    marginTop: SPACING.SM,
  },
  
  progressText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },
  
  progressBar: {
    height: 6,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: 3,
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.SUCCESS,
    borderRadius: 3,
  },
  
  // Empty state
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  
  emptyText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
  },
  
  // Acciones rápidas
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: SPACING.LG,
  },
  
  quickAction: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    paddingVertical: SPACING.LG,
    alignItems: 'center',
    marginHorizontal: SPACING.XS,
  },
  
  quickActionIcon: {
    fontSize: 24,
    marginBottom: SPACING.SM,
  },
  
  quickActionText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.DARK,
    textAlign: 'center',
    fontWeight: '600',
  },
});

export default ProviderHomeScreen;