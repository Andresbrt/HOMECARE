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
import { NavHeader, Card, Button, RequestCard } from '../../components';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme';

/**
 * PANTALLA HISTORIAL DE SERVICIOS DEL CLIENTE
 * Funcionalidades:
 * - Lista de servicios anteriores
 * - Filtros por estado y fecha
 * - Calificar servicios completados
 * - Re-solicitar servicios
 * - Ver detalles y facturas
 */
const ServiceHistoryScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [serviceHistory, setServiceHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtros disponibles
  const filters = [
    { key: 'ALL', label: 'Todos', count: 0 },
    { key: 'COMPLETADO', label: 'Completados', count: 0 },
    { key: 'CANCELADO', label: 'Cancelados', count: 0 },
    { key: 'EN_PROCESO', label: 'En Proceso', count: 0 },
  ];

  // Mock data del historial
  const mockServiceHistory = [
    {
      id: 'SRV-2024-001',
      service: 'Limpieza Completa del Hogar',
      provider: {
        id: 'PROV-001',
        name: 'María González',
        rating: 4.9,
        avatar: null,
      },
      status: 'COMPLETADO',
      date: '2024-01-10',
      time: '14:00',
      address: 'Calle 127 #15-30, Bogotá',
      price: 150000,
      duration: '3 horas',
      rating: null, // Pendiente de calificar
      canReorder: true,
      invoice: 'INV-2024-001',
    },
    {
      id: 'SRV-2024-002',
      service: 'Limpieza de Oficina',
      provider: {
        id: 'PROV-002',
        name: 'Carlos Ruiz',
        rating: 4.7,
        avatar: null,
      },
      status: 'COMPLETADO',
      date: '2024-01-08',
      time: '09:00',
      address: 'Carrera 13 #93-40, Oficina 505',
      price: 200000,
      duration: '2.5 horas',
      rating: 5,
      review: 'Excelente servicio, muy profesional',
      canReorder: true,
      invoice: 'INV-2024-002',
    },
    {
      id: 'SRV-2024-003',
      service: 'Limpieza Post-Construcción',
      provider: {
        id: 'PROV-003',
        name: 'Ana Martínez',
        rating: 4.8,
        avatar: null,
      },
      status: 'CANCELADO',
      date: '2024-01-05',
      time: '10:00',
      address: 'Calle 72 #10-15, Casa',
      price: 300000,
      duration: '5 horas',
      cancelReason: 'Cancelado por el cliente - Cambio de planes',
      canReorder: true,
      invoice: null,
    },
    {
      id: 'SRV-2024-004',
      service: 'Limpieza de Ventanas',
      provider: {
        id: 'PROV-004',
        name: 'Jorge López',
        rating: 4.6,
        avatar: null,
      },
      status: 'EN_PROCESO',
      date: '2024-01-15',
      time: '15:00',
      address: 'Avenida 19 #123-45, Apartamento 801',
      price: 80000,
      duration: '1.5 horas',
      canReorder: false,
      invoice: null,
    },
  ];

  useEffect(() => {
    loadServiceHistory();
  }, []);

  const loadServiceHistory = async () => {
    setLoading(true);
    try {
      // Simular llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1000));
      setServiceHistory(mockServiceHistory);
      updateFilterCounts(mockServiceHistory);
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar el historial de servicios');
    } finally {
      setLoading(false);
    }
  };

  const updateFilterCounts = (services) => {
    const counts = filters.map(filter => ({
      ...filter,
      count: filter.key === 'ALL' 
        ? services.length 
        : services.filter(s => s.status === filter.key).length
    }));
    // Actualizar counts en el estado si fuera necesario
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadServiceHistory().finally(() => setRefreshing(false));
  }, []);

  const getFilteredServices = () => {
    return selectedFilter === 'ALL' 
      ? serviceHistory 
      : serviceHistory.filter(service => service.status === selectedFilter);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'COMPLETADO': return COLORS.SUCCESS;
      case 'CANCELADO': return COLORS.ERROR;
      case 'EN_PROCESO': return COLORS.WARNING;
      default: return COLORS.GRAY_DARK;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'COMPLETADO': return 'Completado';
      case 'CANCELADO': return 'Cancelado';
      case 'EN_PROCESO': return 'En Proceso';
      default: return status;
    }
  };

  const handleServiceAction = (service, action) => {
    switch (action) {
      case 'rate':
        navigation.navigate('ReviewService', { service });
        break;
      case 'reorder':
        navigation.navigate('RequestService', { 
          service: { title: service.service, price: service.price },
          isReorder: true 
        });
        break;
      case 'view_invoice':
        navigation.navigate('Invoice', { invoiceId: service.invoice });
        break;
      case 'track':
        navigation.navigate('Tracking', { requestId: service.id });
        break;
      case 'details':
        navigation.navigate('ServiceOrderDetails', { service });
        break;
    }
  };

  const renderFilterTab = (filter) => (
    <TouchableOpacity
      key={filter.key}
      style={[
        styles.filterTab,
        selectedFilter === filter.key && styles.filterTabActive,
      ]}
      onPress={() => setSelectedFilter(filter.key)}
    >
      <Text style={[
        styles.filterTabText,
        selectedFilter === filter.key && styles.filterTabTextActive,
      ]}>
        {filter.label}
      </Text>
      <Text style={[
        styles.filterTabCount,
        selectedFilter === filter.key && styles.filterTabCountActive,
      ]}>
        {filter.count}
      </Text>
    </TouchableOpacity>
  );

  const renderServiceItem = ({ item }) => (
    <Card style={styles.serviceCard}>
      {/* Header */}
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceName}>{item.service}</Text>
          <Text style={styles.serviceDate}>📅 {item.date} a las {item.time}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
          <Text style={styles.statusText}>{getStatusText(item.status)}</Text>
        </View>
      </View>

      {/* Proveedor */}
      <View style={styles.providerInfo}>
        <View style={styles.providerAvatar}>
          <Text style={styles.providerAvatarText}>
            {item.provider.name.charAt(0)}
          </Text>
        </View>
        <View style={styles.providerDetails}>
          <Text style={styles.providerName}>{item.provider.name}</Text>
          <Text style={styles.providerRating}>⭐ {item.provider.rating}</Text>
        </View>
      </View>

      {/* Detalles del servicio */}
      <View style={styles.serviceDetails}>
        <Text style={styles.serviceAddress}>📍 {item.address}</Text>
        <Text style={styles.serviceDuration}>⏱️ Duración: {item.duration}</Text>
        <Text style={styles.servicePrice}>💰 ${item.price.toLocaleString()}</Text>
      </View>

      {/* Calificación (si está completado y calificado) */}
      {item.status === 'COMPLETADO' && item.rating && (
        <View style={styles.reviewSection}>
          <Text style={styles.reviewStars}>{'⭐'.repeat(item.rating)}</Text>
          {item.review && <Text style={styles.reviewText}>"{item.review}"</Text>}
        </View>
      )}

      {/* Razón de cancelación */}
      {item.status === 'CANCELADO' && item.cancelReason && (
        <View style={styles.cancelSection}>
          <Text style={styles.cancelReason}>❌ {item.cancelReason}</Text>
        </View>
      )}

      {/* Acciones */}
      <View style={styles.actionSection}>
        <View style={styles.actionButtons}>
          {/* Botón principal según el estado */}
          {item.status === 'COMPLETADO' && !item.rating && (
            <Button
              title="Calificar"
              onPress={() => handleServiceAction(item, 'rate')}
              variant="primary"
              size="small"
              style={styles.actionButton}
            />
          )}
          
          {item.status === 'EN_PROCESO' && (
            <Button
              title="Seguir"
              onPress={() => handleServiceAction(item, 'track')}
              variant="primary"
              size="small"
              style={styles.actionButton}
            />
          )}

          {/* Ver factura (si existe) */}
          {item.invoice && (
            <Button
              title="Factura"
              onPress={() => handleServiceAction(item, 'view_invoice')}
              variant="outline"
              size="small"
              style={styles.actionButton}
            />
          )}

          {/* Re-solicitar servicio */}
          {item.canReorder && (
            <Button
              title="Repetir"
              onPress={() => handleServiceAction(item, 'reorder')}
              variant="outline"
              size="small"
              style={styles.actionButton}
            />
          )}
        </View>

        {/* Ver detalles completos */}
        <TouchableOpacity
          style={styles.detailsButton}
          onPress={() => handleServiceAction(item, 'details')}
        >
          <Text style={styles.detailsButtonText}>Ver detalles</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>No hay servicios</Text>
      <Text style={styles.emptyMessage}>
        {selectedFilter === 'ALL' 
          ? 'Aún no has solicitado ningún servicio'
          : `No tienes servicios con estado "${getStatusText(selectedFilter)}"`
        }
      </Text>
      {selectedFilter === 'ALL' && (
        <Button
          title="Solicitar Primer Servicio"
          onPress={() => navigation.navigate('ClientHome')}
          variant="primary"
          style={styles.emptyButton}
        />
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <NavHeader
        title="Historial de Servicios"
        onBack={() => navigation.goBack()}
      />

      {/* Filtros */}
      <View style={styles.filtersContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersContent}
        >
          {filters.map(renderFilterTab)}
        </ScrollView>
      </View>

      {/* Lista de servicios */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <Text>Cargando historial...</Text>
        </View>
      ) : (
        <FlatList
          data={getFilteredServices()}
          renderItem={renderServiceItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  
  // Filtros
  filtersContainer: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  
  filtersContent: {
    paddingHorizontal: SPACING.MD,
  },
  
  filterTab: {
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    marginRight: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: COLORS.GRAY_LIGHT,
    alignItems: 'center',
  },
  
  filterTabActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  
  filterTabText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.GRAY_DARK,
  },
  
  filterTabTextActive: {
    color: COLORS.WHITE,
  },
  
  filterTabCount: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  filterTabCountActive: {
    color: COLORS.WHITE,
  },
  
  // Lista
  listContainer: {
    padding: SPACING.MD,
    flexGrow: 1,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Servicio item
  serviceCard: {
    marginBottom: SPACING.MD,
  },
  
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  
  serviceInfo: {
    flex: 1,
    marginRight: SPACING.MD,
  },
  
  serviceName: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },
  
  serviceDate: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
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
    textTransform: 'uppercase',
  },
  
  // Proveedor
  providerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  
  providerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.SECONDARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  
  providerAvatarText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  
  providerDetails: {
    flex: 1,
  },
  
  providerName: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  
  providerRating: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  // Detalles
  serviceDetails: {
    marginBottom: SPACING.MD,
  },
  
  serviceAddress: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.XS,
  },
  
  serviceDuration: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.XS,
  },
  
  servicePrice: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.PRIMARY,
  },
  
  // Reseña
  reviewSection: {
    marginBottom: SPACING.MD,
    padding: SPACING.SM,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: BORDER_RADIUS.SM,
  },
  
  reviewStars: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    marginBottom: SPACING.XS,
  },
  
  reviewText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    fontStyle: 'italic',
  },
  
  // Cancelación
  cancelSection: {
    marginBottom: SPACING.MD,
    padding: SPACING.SM,
    backgroundColor: COLORS.ERROR + '20',
    borderRadius: BORDER_RADIUS.SM,
  },
  
  cancelReason: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.ERROR,
  },
  
  // Acciones
  actionSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
    paddingTop: SPACING.MD,
  },
  
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.SM,
  },
  
  actionButton: {
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
  
  detailsButton: {
    alignSelf: 'center',
    paddingVertical: SPACING.SM,
  },
  
  detailsButtonText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  
  // Empty state
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.XL,
  },
  
  emptyIcon: {
    fontSize: 64,
    marginBottom: SPACING.LG,
    opacity: 0.5,
  },
  
  emptyTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.SM,
  },
  
  emptyMessage: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.LG,
  },
  
  emptyButton: {
    minWidth: 200,
  },
});

export default ServiceHistoryScreen;