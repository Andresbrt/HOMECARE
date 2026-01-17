import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  RefreshControl,
} from 'react-native';
import { NavHeader, Button, Card } from '../../components';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { requestService } from '../../services/requestService';
import { offerService } from '../../services/offerService';

/**
 * PANTALLA DETALLES DE SOLICITUD
 * Integrada con el backend Spring Boot
 */
const ServiceDetailsScreen = ({ navigation, route }) => {
  const { requestId } = route.params || {};
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requestData, setRequestData] = useState(null);
  const [offers, setOffers] = useState([]);

  useEffect(() => {
    if (requestId) {
      loadRequestDetails();
    }
  }, [requestId]);

  const loadRequestDetails = async () => {
    setLoading(true);
    try {
      const request = await requestService.getRequestById(requestId);
      setRequestData(request);

      const requestOffers = await offerService.getOffersByRequest(requestId);
      setOffers(requestOffers.offers || []);

    } catch (error) {
      console.error('Error loading request details:', error);
      Alert.alert('Error', 'No se pudieron cargar los detalles de la solicitud');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadRequestDetails().finally(() => setRefreshing(false));
  }, []);

  const handleAcceptOffer = async (offer) => {
    try {
      Alert.alert(
        'Aceptar Oferta',
        `¿Estás seguro de que quieres aceptar la oferta de ${offer.providerName} por $${offer.price.toLocaleString()}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Aceptar',
            onPress: async () => {
              setLoading(true);
              try {
                await offerService.acceptOffer(offer.id);
                Alert.alert(
                  'Oferta Aceptada',
                  'La oferta ha sido aceptada. El proveedor será notificado.',
                  [{ text: 'OK', onPress: loadRequestDetails }]
                );
              } catch (error) {
                Alert.alert('Error', 'No se pudo aceptar la oferta');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error accepting offer:', error);
    }
  };

  const handleRejectOffer = async (offer) => {
    try {
      Alert.alert(
        'Rechazar Oferta',
        `¿Estás seguro de que quieres rechazar la oferta de ${offer.providerName}?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Rechazar',
            onPress: async () => {
              setLoading(true);
              try {
                await offerService.rejectOffer(offer.id);
                Alert.alert(
                  'Oferta Rechazada',
                  'La oferta ha sido rechazada.',
                  [{ text: 'OK', onPress: loadRequestDetails }]
                );
              } catch (error) {
                Alert.alert('Error', 'No se pudo rechazar la oferta');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error rejecting offer:', error);
    }
  };

  const handleCancelRequest = async () => {
    try {
      Alert.alert(
        'Cancelar Solicitud',
        '¿Estás seguro de que quieres cancelar esta solicitud?',
        [
          { text: 'No', style: 'cancel' },
          {
            text: 'Sí, Cancelar',
            style: 'destructive',
            onPress: async () => {
              setLoading(true);
              try {
                await requestService.cancelRequest(requestId);
                Alert.alert(
                  'Solicitud Cancelada',
                  'Tu solicitud ha sido cancelada exitosamente.',
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              } catch (error) {
                Alert.alert('Error', 'No se pudo cancelar la solicitud');
              } finally {
                setLoading(false);
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error canceling request:', error);
    }
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

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const renderOffer = (offer) => (
    <Card key={offer.id} style={styles.offerCard}>
      <View style={styles.offerHeader}>
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{offer.providerName}</Text>
          <Text style={styles.providerRating}>⭐ {offer.providerRating || 5.0}</Text>
        </View>
        
        <View style={styles.offerPrice}>
          <Text style={styles.priceValue}>{formatCurrency(offer.price)}</Text>
          <Text style={styles.priceLabel}>Precio Total</Text>
        </View>
      </View>
      
      <View style={styles.offerDetails}>
        <Text style={styles.offerTime}>
          📅 {offer.serviceDate} • {offer.startTime}
        </Text>
        {offer.message && (
          <Text style={styles.offerMessage}>{offer.message}</Text>
        )}
      </View>
      
      <View style={styles.offerStatus}>
        <View style={[
          styles.statusBadge,
          { backgroundColor: getStatusColor(offer.status) }
        ]}>
          <Text style={styles.statusText}>{offer.statusLabel}</Text>
        </View>
        
        {offer.status === 'PENDIENTE' && (
          <View style={styles.offerActions}>
            <Button
              title="Rechazar"
              variant="outline"
              size="small"
              onPress={() => handleRejectOffer(offer)}
              style={styles.rejectButton}
            />
            <Button
              title="Aceptar"
              variant="primary"
              size="small"
              onPress={() => handleAcceptOffer(offer)}
              style={styles.acceptButton}
            />
          </View>
        )}
      </View>
    </Card>
  );

  if (loading && !requestData) {
    return (
      <View style={styles.container}>
        <NavHeader
          title="Detalles del Servicio"
          onBack={() => navigation.goBack()}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Cargando...</Text>
        </View>
      </View>
    );
  }

  if (!requestData) {
    return (
      <View style={styles.container}>
        <NavHeader
          title="Detalles del Servicio"
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
        title="Detalles de Solicitud"
        onBack={() => navigation.goBack()}
      />

      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Información Principal */}
        <Card style={styles.mainInfoCard}>
          <View style={styles.requestHeader}>
            <View style={styles.requestInfo}>
              <Text style={styles.requestTitle}>{requestData.title}</Text>
              <Text style={styles.requestType}>{requestData.cleaningTypeLabel}</Text>
            </View>
            
            <View style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(requestData.status) }
            ]}>
              <Text style={styles.statusText}>{requestData.statusLabel}</Text>
            </View>
          </View>
          
          <Text style={styles.requestDescription}>{requestData.description}</Text>
          
          <View style={styles.requestDetails}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>📍 Dirección:</Text>
              <Text style={styles.detailValue}>{requestData.address}</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>📅 Fecha:</Text>
              <Text style={styles.detailValue}>
                {formatDate(requestData.serviceDate)} • {requestData.startTime}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>⏰ Duración:</Text>
              <Text style={styles.detailValue}>{requestData.duration} horas</Text>
            </View>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>💰 Precio máximo:</Text>
              <Text style={styles.priceValue}>{formatCurrency(requestData.maxPrice)}</Text>
            </View>
            
            {requestData.contactPhone && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>📞 Contacto:</Text>
                <Text style={styles.detailValue}>{requestData.contactPhone}</Text>
              </View>
            )}
          </View>

          {requestData.additionalNotes && (
            <View style={styles.notesSection}>
              <Text style={styles.notesLabel}>📝 Notas adicionales:</Text>
              <Text style={styles.notesText}>{requestData.additionalNotes}</Text>
            </View>
          )}
        </Card>

        {/* Opciones especiales */}
        {(requestData.urgentService || requestData.provideSupplies || requestData.petFriendly || requestData.needKeys) && (
          <Card style={styles.optionsCard}>
            <Text style={styles.sectionTitle}>🔧 Opciones Especiales</Text>
            
            {requestData.urgentService && (
              <View style={styles.optionItem}>
                <Text style={styles.optionIcon}>⚡</Text>
                <Text style={styles.optionText}>Servicio Urgente</Text>
              </View>
            )}
            
            {requestData.provideSupplies && (
              <View style={styles.optionItem}>
                <Text style={styles.optionIcon}>🧽</Text>
                <Text style={styles.optionText}>Incluir productos de limpieza</Text>
              </View>
            )}
            
            {requestData.petFriendly && (
              <View style={styles.optionItem}>
                <Text style={styles.optionIcon}>🐕</Text>
                <Text style={styles.optionText}>Pet-friendly</Text>
              </View>
            )}
            
            {requestData.needKeys && (
              <View style={styles.optionItem}>
                <Text style={styles.optionIcon}>🗝️</Text>
                <Text style={styles.optionText}>Se entregarán llaves</Text>
              </View>
            )}
          </Card>
        )}

        {/* Ofertas recibidas */}
        <Card style={styles.offersCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💼 Ofertas Recibidas</Text>
            <Text style={styles.offersCount}>
              {offers.length} {offers.length === 1 ? 'oferta' : 'ofertas'}
            </Text>
          </View>
          
          {offers.length === 0 ? (
            <View style={styles.noOffersContainer}>
              <Text style={styles.noOffersIcon}>📋</Text>
              <Text style={styles.noOffersTitle}>Sin ofertas aún</Text>
              <Text style={styles.noOffersSubtitle}>
                Los proveedores podrán enviarte ofertas para tu solicitud
              </Text>
            </View>
          ) : (
            offers.map(renderOffer)
          )}
        </Card>

        {/* Acciones */}
        {['ABIERTA', 'CON_OFERTAS'].includes(requestData.status) && (
          <Card style={styles.actionsCard}>
            <Text style={styles.sectionTitle}>⚙️ Acciones</Text>
            
            <Button
              title="Cancelar Solicitud"
              variant="outline"
              fullWidth
              onPress={handleCancelRequest}
              style={styles.cancelButton}
            />
            
            <Text style={styles.actionNote}>
              Puedes cancelar tu solicitud en cualquier momento antes de aceptar una oferta.
            </Text>
          </Card>
        )}

        {/* Información de seguimiento */}
        {requestData.status === 'EN_PROGRESO' && (
          <Card style={styles.trackingCard}>
            <Text style={styles.sectionTitle}>📍 Seguimiento</Text>
            <Button
              title="Ver Ubicación en Tiempo Real"
              variant="primary"
              fullWidth
              onPress={() => navigation.navigate('TrackingScreen', { requestId: requestData.id })}
            />
          </Card>
        )}
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
  },

  loadingText: {
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

  // Información principal
  mainInfoCard: {
    marginTop: SPACING.MD,
    marginBottom: SPACING.MD,
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
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: '700',
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },

  requestType: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },

  requestDescription: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    lineHeight: 20,
    marginBottom: SPACING.LG,
  },

  requestDetails: {
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
    paddingTop: SPACING.MD,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.SM,
  },

  detailLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    flex: 1,
  },

  detailValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },

  priceValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '700',
    color: COLORS.SUCCESS,
    textAlign: 'right',
  },

  notesSection: {
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
    paddingTop: SPACING.MD,
    marginTop: SPACING.MD,
  },

  notesLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.SM,
  },

  notesText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    lineHeight: 18,
  },

  // Opciones especiales
  optionsCard: {
    marginBottom: SPACING.MD,
  },

  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },

  optionIcon: {
    fontSize: 20,
    marginRight: SPACING.SM,
  },

  optionText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    flex: 1,
  },

  // Ofertas
  offersCard: {
    marginBottom: SPACING.MD,
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

  offersCount: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    fontWeight: '500',
  },

  noOffersContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },

  noOffersIcon: {
    fontSize: 48,
    marginBottom: SPACING.MD,
  },

  noOffersTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '600',
    color: COLORS.DARK,
    textAlign: 'center',
    marginBottom: SPACING.SM,
  },

  noOffersSubtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
  },

  offerCard: {
    marginBottom: SPACING.MD,
  },

  offerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },

  providerInfo: {
    flex: 1,
  },

  providerName: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },

  providerRating: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.WARNING,
  },

  offerPrice: {
    alignItems: 'flex-end',
    marginLeft: SPACING.MD,
  },

  priceLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.XS,
  },

  offerDetails: {
    marginBottom: SPACING.MD,
  },

  offerTime: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.SM,
  },

  offerMessage: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    fontStyle: 'italic',
    backgroundColor: COLORS.GRAY_LIGHT,
    padding: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
  },

  offerStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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

  offerActions: {
    flexDirection: 'row',
  },

  rejectButton: {
    marginRight: SPACING.SM,
    minWidth: 80,
  },

  acceptButton: {
    minWidth: 80,
  },

  // Acciones
  actionsCard: {
    marginBottom: SPACING.MD,
  },

  cancelButton: {
    marginBottom: SPACING.MD,
  },

  actionNote: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Seguimiento
  trackingCard: {
    marginBottom: SPACING.XL,
  },
});

export default ServiceDetailsScreen;