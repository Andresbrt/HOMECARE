import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button, Input } from '../../components';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { requestService } from '../../services/requestService';

/**
 * HOME SCREEN DEL CLIENTE
 * Integrada con el backend Spring Boot para gestión de solicitudes
 */
const ClientHomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [myRequests, setMyRequests] = useState([]);
  const [stats, setStats] = useState({
    activeRequests: 0,
    completedServices: 0,
    totalSpent: 0,
    averageRating: 0,
  });

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    setLoading(true);
    try {
      // Cargar mis solicitudes recientes
      const requestsResponse = await requestService.getMyRequests(null, 0, 5);
      setMyRequests(requestsResponse.requests || []);
      
      // Calcular estadísticas básicas
      const activeCount = requestsResponse.requests.filter(req => 
        ['ABIERTA', 'CON_OFERTAS', 'OFERTA_ACEPTADA', 'EN_PROGRESO'].includes(req.status)
      ).length;
      
      const completedCount = requestsResponse.requests.filter(req => 
        req.status === 'COMPLETADA'
      ).length;

      setStats({
        activeRequests: activeCount,
        completedServices: completedCount,
        totalSpent: user?.completedServices * 75000 || 0, // Mock calculation
        averageRating: user?.rating || 0,
      });

    } catch (error) {
      console.error('Error loading home data:', error);
      Alert.alert('Error', 'No se pudieron cargar los datos');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadHomeData().finally(() => setRefreshing(false));
  }, []);

  const handleCreateRequest = () => {
    navigation.navigate('RequestService');
  };

  const handleViewAllRequests = () => {
    navigation.navigate('ServiceHistory');
  };

  const handleRequestPress = (request) => {
    navigation.navigate('ServiceDetails', { requestId: request.id });
  };

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'ABIERTA': COLORS.PRIMARY,
      'CON_OFERTAS': COLORS.WARNING,
      'OFERTA_ACEPTADA': COLORS.SUCCESS,
      'EN_PROGRESO': COLORS.SECONDARY,
      'COMPLETADA': COLORS.SUCCESS,
      'CANCELADA': COLORS.ERROR,
      'EXPIRADA': COLORS.GRAY_DARK,
    };
    
    return colors[status] || COLORS.GRAY_DARK;
  };

  const renderQuickStats = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>📊 Resumen</Text>
      
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.activeRequests}</Text>
          <Text style={styles.statLabel}>Activas</Text>
        </Card>
        
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.completedServices}</Text>
          <Text style={styles.statLabel}>Completadas</Text>
        </Card>
        
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{formatCurrency(stats.totalSpent)}</Text>
          <Text style={styles.statLabel}>Gastado</Text>
        </Card>
        
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>⭐ {stats.averageRating.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Calificación</Text>
        </Card>
      </View>
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.actionsContainer}>
      <Text style={styles.sectionTitle}>⚡ Acciones Rápidas</Text>
      
      <View style={styles.actionsGrid}>
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={handleCreateRequest}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>🏠</Text>
          <Text style={styles.actionTitle}>Solicitar Limpieza</Text>
          <Text style={styles.actionSubtitle}>Crear nueva solicitud</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('TrackingScreen')}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>📍</Text>
          <Text style={styles.actionTitle}>Rastrear Servicio</Text>
          <Text style={styles.actionSubtitle}>Ver ubicación en tiempo real</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={handleViewAllRequests}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionTitle}>Historial</Text>
          <Text style={styles.actionSubtitle}>Ver servicios anteriores</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>👤</Text>
          <Text style={styles.actionTitle}>Mi Perfil</Text>
          <Text style={styles.actionSubtitle}>Configuración de cuenta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderRecentRequests = () => (
    <View style={styles.requestsContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📝 Solicitudes Recientes</Text>
        <TouchableOpacity onPress={handleViewAllRequests}>
          <Text style={styles.seeAllText}>Ver todas</Text>
        </TouchableOpacity>
      </View>
      
      {myRequests.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📋</Text>
          <Text style={styles.emptyTitle}>No tienes solicitudes</Text>
          <Text style={styles.emptySubtitle}>
            Crea tu primera solicitud de limpieza
          </Text>
          <Button
            title="Solicitar Limpieza"
            onPress={handleCreateRequest}
            style={styles.emptyButton}
          />
        </Card>
      ) : (
        <FlatList
          data={myRequests}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleRequestPress(item)}
              activeOpacity={0.7}
            >
              <Card style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestTitle}>{item.title}</Text>
                    <Text style={styles.requestType}>{item.cleaningTypeLabel}</Text>
                    <Text style={styles.requestDate}>
                      📅 {item.serviceDate} • {item.startTime}
                    </Text>
                  </View>
                  
                  <View style={styles.requestStatus}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(item.status) }
                    ]}>
                      <Text style={styles.statusText}>{item.statusLabel}</Text>
                    </View>
                    
                    {item.maxPrice && (
                      <Text style={styles.requestPrice}>
                        {formatCurrency(item.maxPrice)}
                      </Text>
                    )}
                  </View>
                </View>
                
                <Text style={styles.requestAddress}>
                  📍 {item.address}
                </Text>
                
                {item.offersCount > 0 && (
                  <View style={styles.requestFooter}>
                    <Text style={styles.offersCount}>
                      🎯 {item.offersCount} ofertas recibidas
                    </Text>
                  </View>
                )}
              </Card>
            </TouchableOpacity>
          )}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.greeting}>¡Hola, {user?.firstName || 'Usuario'}!</Text>
            <Text style={styles.subtitle}>¿Qué necesitas limpiar hoy?</Text>
          </View>
          
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            <Text style={styles.profileIcon}>👤</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Botón principal */}
        <View style={styles.mainActionContainer}>
          <Button
            title="+ Solicitar Limpieza"
            onPress={handleCreateRequest}
            size="large"
            fullWidth
            style={styles.mainActionButton}
          />
        </View>

        {/* Estadísticas rápidas */}
        {renderQuickStats()}

        {/* Acciones rápidas */}
        {renderQuickActions()}

        {/* Solicitudes recientes */}
        {renderRecentRequests()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY_LIGHT,
  },

  header: {
    backgroundColor: COLORS.WHITE,
    paddingHorizontal: SPACING.LG,
    paddingTop: SPACING.MD,
    paddingBottom: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },

  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  greeting: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: '700',
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },

  subtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
  },

  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileIcon: {
    fontSize: 20,
    color: COLORS.WHITE,
  },

  content: {
    flex: 1,
    paddingHorizontal: SPACING.LG,
  },

  // Botón principal
  mainActionContainer: {
    paddingVertical: SPACING.LG,
  },

  mainActionButton: {
    marginBottom: 0,
  },

  // Estadísticas
  statsContainer: {
    marginBottom: SPACING.LG,
  },

  sectionTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.DARK,
    marginBottom: SPACING.MD,
  },

  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.LG,
    marginHorizontal: SPACING.XS,
  },

  statNumber: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },

  statLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
  },

  // Acciones rápidas
  actionsContainer: {
    marginBottom: SPACING.LG,
  },

  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  actionCard: {
    width: '48%',
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
  },

  actionIcon: {
    fontSize: 32,
    marginBottom: SPACING.SM,
  },

  actionTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.DARK,
    textAlign: 'center',
    marginBottom: SPACING.XS,
  },

  actionSubtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
  },

  // Solicitudes
  requestsContainer: {
    marginBottom: SPACING.XL,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },

  seeAllText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },

  // Estado vacío
  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
    paddingHorizontal: SPACING.LG,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.MD,
  },

  emptyTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '600',
    color: COLORS.DARK,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },

  emptySubtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
    marginBottom: SPACING.LG,
  },

  emptyButton: {
    minWidth: 200,
  },

  // Card de solicitud
  requestCard: {
    marginBottom: SPACING.MD,
    paddingVertical: SPACING.MD,
  },

  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },

  requestInfo: {
    flex: 1,
  },

  requestTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },

  requestType: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: '500',
    marginBottom: SPACING.XS,
  },

  requestDate: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
  },

  requestStatus: {
    alignItems: 'flex-end',
    marginLeft: SPACING.MD,
  },

  statusBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    marginBottom: SPACING.XS,
  },

  statusText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.WHITE,
    fontWeight: '600',
  },

  requestPrice: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.SUCCESS,
  },

  requestAddress: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.SM,
  },

  requestFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
    paddingTop: SPACING.SM,
  },

  offersCount: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
});

export default ClientHomeScreen;