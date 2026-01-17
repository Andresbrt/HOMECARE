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
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Button } from '../../components';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { requestService } from '../../services/requestService';
import { offerService } from '../../services/offerService';

/**
 * HOME SCREEN DEL PROVEEDOR
 * Integrada con el backend Spring Boot para gestión de ofertas y solicitudes
 */
const ProviderHomeScreen = ({ navigation }) => {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [nearbyRequests, setNearbyRequests] = useState([]);
  const [myOffers, setMyOffers] = useState([]);
  const [stats, setStats] = useState({
    todayOffers: 0,
    acceptedOffers: 0,
    todayEarnings: 0,
    averageRating: 0,
  });

  useEffect(() => {
    loadHomeData();
  }, []);

  const loadHomeData = async () => {
    setLoading(true);
    try {
      // Cargar solicitudes cercanas
      const requestsResponse = await requestService.getNearbyRequests({
        latitude: user?.latitude || -4.5709,  // Coordenadas por defecto
        longitude: user?.longitude || -74.2973,
        radius: 10000, // 10km
      }, 0, 10);
      
      setNearbyRequests(requestsResponse.requests || []);

      // Cargar mis ofertas activas
      const offersResponse = await offerService.getMyOffers(['PENDIENTE', 'ACEPTADA'], 0, 5);
      setMyOffers(offersResponse.offers || []);

      // Calcular estadísticas del día
      const today = new Date().toISOString().split('T')[0];
      const todayOffers = offersResponse.offers.filter(offer => 
        offer.createdAt.startsWith(today)
      ).length;

      const acceptedOffers = offersResponse.offers.filter(offer => 
        offer.status === 'ACEPTADA'
      ).length;

      setStats({
        todayOffers,
        acceptedOffers,
        todayEarnings: user?.todayEarnings || 0,
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

  const handleRequestPress = (request) => {
    navigation.navigate('RequestDetails', { requestId: request.id });
  };

  const handleOfferPress = (offer) => {
    navigation.navigate('OfferDetails', { offerId: offer.id });
  };

  const handleCreateOffer = (request) => {
    navigation.navigate('CreateOffer', { requestId: request.id });
  };

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      'ABIERTA': COLORS.PRIMARY,
      'CON_OFERTAS': COLORS.WARNING,
      'PENDIENTE': COLORS.WARNING,
      'ACEPTADA': COLORS.SUCCESS,
      'RECHAZADA': COLORS.ERROR,
      'EN_PROGRESO': COLORS.SECONDARY,
      'COMPLETADA': COLORS.SUCCESS,
      'CANCELADA': COLORS.ERROR,
    };
    
    return colors[status] || COLORS.GRAY_DARK;
  };

  const renderAvailabilityToggle = () => (
    <View style={styles.availabilityContainer}>
      <Card style={styles.availabilityCard}>
        <View style={styles.availabilityHeader}>
          <View>
            <Text style={styles.availabilityTitle}>Estado de Disponibilidad</Text>
            <Text style={styles.availabilitySubtitle}>
              {isAvailable ? 'Recibiendo solicitudes' : 'No disponible'}
            </Text>
          </View>
          
          <Switch
            value={isAvailable}
            onValueChange={setIsAvailable}
            trackColor={{
              false: COLORS.GRAY,
              true: COLORS.PRIMARY,
            }}
            thumbColor={isAvailable ? COLORS.WHITE : COLORS.GRAY_DARK}
          />
        </View>
      </Card>
    </View>
  );

  const renderQuickStats = () => (
    <View style={styles.statsContainer}>
      <Text style={styles.sectionTitle}>📊 Estadísticas de Hoy</Text>
      
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.todayOffers}</Text>
          <Text style={styles.statLabel}>Ofertas Enviadas</Text>
        </Card>
        
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.acceptedOffers}</Text>
          <Text style={styles.statLabel}>Aceptadas</Text>
        </Card>
        
        <Card style={styles.statCard}>
          <Text style={styles.statNumber}>{formatCurrency(stats.todayEarnings)}</Text>
          <Text style={styles.statLabel}>Ganado</Text>
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
          onPress={() => navigation.navigate('MyOffers')}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>📋</Text>
          <Text style={styles.actionTitle}>Mis Ofertas</Text>
          <Text style={styles.actionSubtitle}>Ver ofertas activas</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('ServiceHistory')}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>📊</Text>
          <Text style={styles.actionTitle}>Historial</Text>
          <Text style={styles.actionSubtitle}>Servicios completados</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Earnings')}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>💰</Text>
          <Text style={styles.actionTitle}>Ganancias</Text>
          <Text style={styles.actionSubtitle}>Ver ingresos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionCard}
          onPress={() => navigation.navigate('Profile')}
          activeOpacity={0.7}
        >
          <Text style={styles.actionIcon}>👤</Text>
          <Text style={styles.actionTitle}>Mi Perfil</Text>
          <Text style={styles.actionSubtitle}>Configuración</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNearbyRequests = () => (
    <View style={styles.requestsContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>🎯 Solicitudes Cercanas</Text>
        <TouchableOpacity onPress={() => navigation.navigate('RequestsList')}>
          <Text style={styles.seeAllText}>Ver todas</Text>
        </TouchableOpacity>
      </View>
      
      {!isAvailable ? (
        <Card style={styles.notAvailableCard}>
          <Text style={styles.notAvailableIcon}>😴</Text>
          <Text style={styles.notAvailableTitle}>No estás disponible</Text>
          <Text style={styles.notAvailableSubtitle}>
            Activa tu disponibilidad para ver solicitudes
          </Text>
        </Card>
      ) : nearbyRequests.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>🔍</Text>
          <Text style={styles.emptyTitle}>No hay solicitudes cercanas</Text>
          <Text style={styles.emptySubtitle}>
            Te notificaremos cuando haya nuevas solicitudes en tu área
          </Text>
        </Card>
      ) : (
        <FlatList
          data={nearbyRequests}
          renderItem={({ item }) => (
            <Card style={styles.requestCard}>
              <TouchableOpacity
                onPress={() => handleRequestPress(item)}
                activeOpacity={0.7}
              >
                <View style={styles.requestHeader}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestTitle}>{item.title}</Text>
                    <Text style={styles.requestType}>{item.cleaningTypeLabel}</Text>
                    <Text style={styles.requestDate}>
                      📅 {item.serviceDate} • {item.startTime}
                    </Text>
                    <Text style={styles.requestAddress}>
                      📍 {item.address}
                    </Text>
                  </View>
                  
                  <View style={styles.requestPricing}>
                    {item.maxPrice && (
                      <Text style={styles.requestMaxPrice}>
                        Máx: {formatCurrency(item.maxPrice)}
                      </Text>
                    )}
                    <Text style={styles.requestDistance}>
                      📏 {item.distance || '1.2'} km
                    </Text>
                  </View>
                </View>

                <View style={styles.requestFooter}>
                  <View style={styles.requestMeta}>
                    <Text style={styles.requestTime}>
                      ⏰ Publicado hace {item.timeAgo || '2h'}
                    </Text>
                    {item.offersCount > 0 && (
                      <Text style={styles.offersCount}>
                        🎯 {item.offersCount} ofertas
                      </Text>
                    )}
                  </View>
                  
                  <Button
                    title="Enviar Oferta"
                    onPress={() => handleCreateOffer(item)}
                    size="small"
                    style={styles.offerButton}
                  />
                </View>
              </TouchableOpacity>
            </Card>
          )}
          keyExtractor={(item) => item.id.toString()}
          scrollEnabled={false}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );

  const renderMyOffers = () => (
    <View style={styles.offersContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>📋 Mis Ofertas Recientes</Text>
        <TouchableOpacity onPress={() => navigation.navigate('MyOffers')}>
          <Text style={styles.seeAllText}>Ver todas</Text>
        </TouchableOpacity>
      </View>
      
      {myOffers.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyIcon}>📝</Text>
          <Text style={styles.emptyTitle}>No tienes ofertas activas</Text>
          <Text style={styles.emptySubtitle}>
            Busca solicitudes y envía tus primeras ofertas
          </Text>
        </Card>
      ) : (
        <FlatList
          data={myOffers}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => handleOfferPress(item)}
              activeOpacity={0.7}
            >
              <Card style={styles.offerCard}>
                <View style={styles.offerHeader}>
                  <View style={styles.offerInfo}>
                    <Text style={styles.offerRequestTitle}>{item.requestTitle}</Text>
                    <Text style={styles.offerDetails}>
                      Mi oferta: {formatCurrency(item.price)}
                    </Text>
                    <Text style={styles.offerDate}>
                      📅 Enviada el {item.createdAt?.split('T')[0]}
                    </Text>
                  </View>
                  
                  <View style={styles.offerStatus}>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(item.status) }
                    ]}>
                      <Text style={styles.statusText}>{item.statusLabel}</Text>
                    </View>
                  </View>
                </View>
                
                {item.message && (
                  <View style={styles.offerMessage}>
                    <Text style={styles.offerMessageText}>{item.message}</Text>
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
            <Text style={styles.greeting}>¡Hola, {user?.firstName || 'Proveedor'}!</Text>
            <Text style={styles.subtitle}>Encuentra nuevos trabajos cerca de ti</Text>
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
        {/* Toggle de disponibilidad */}
        {renderAvailabilityToggle()}

        {/* Estadísticas del día */}
        {renderQuickStats()}

        {/* Acciones rápidas */}
        {renderQuickActions()}

        {/* Solicitudes cercanas */}
        {renderNearbyRequests()}

        {/* Mis ofertas recientes */}
        {renderMyOffers()}
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

  // Disponibilidad
  availabilityContainer: {
    paddingVertical: SPACING.MD,
  },

  availabilityCard: {
    paddingVertical: SPACING.LG,
  },

  availabilityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  availabilityTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },

  availabilitySubtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
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

  // Secciones
  requestsContainer: {
    marginBottom: SPACING.LG,
  },

  offersContainer: {
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

  // Estados vacíos
  notAvailableCard: {
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },

  notAvailableIcon: {
    fontSize: 48,
    marginBottom: SPACING.MD,
  },

  notAvailableTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '600',
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },

  notAvailableSubtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
  },

  emptyCard: {
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
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
  },

  // Cards de solicitud
  requestCard: {
    marginBottom: SPACING.MD,
    paddingVertical: SPACING.MD,
  },

  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
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
    marginBottom: SPACING.XS,
  },

  requestAddress: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
  },

  requestPricing: {
    alignItems: 'flex-end',
    marginLeft: SPACING.MD,
  },

  requestMaxPrice: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.SUCCESS,
    marginBottom: SPACING.XS,
  },

  requestDistance: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
  },

  requestFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
    paddingTop: SPACING.SM,
  },

  requestMeta: {
    flex: 1,
  },

  requestTime: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.XS,
  },

  offersCount: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },

  offerButton: {
    marginLeft: SPACING.MD,
    minWidth: 100,
  },

  // Cards de oferta
  offerCard: {
    marginBottom: SPACING.MD,
    paddingVertical: SPACING.MD,
  },

  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },

  offerInfo: {
    flex: 1,
  },

  offerRequestTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },

  offerDetails: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: '500',
    marginBottom: SPACING.XS,
  },

  offerDate: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
  },

  offerStatus: {
    alignItems: 'flex-end',
    marginLeft: SPACING.MD,
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

  offerMessage: {
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: BORDER_RADIUS.SM,
    padding: SPACING.SM,
    marginTop: SPACING.SM,
  },

  offerMessageText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    fontStyle: 'italic',
  },
});

export default ProviderHomeScreen;