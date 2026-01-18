import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, SHADOWS } from '../theme';

/**
 * CARD HOMECARE
 * Componente base para mostrar información estructurada
 * Variantes:
 * - servicio: Para mostrar servicios de limpieza
 * - proveedor: Para mostrar perfiles de proveedores
 * - solicitud: Para mostrar solicitudes activas
 * - promocion: Para mostrar ofertas especiales
 */
export const Card = ({
  children,
  variant = 'default',
  onPress,
  style,
  shadow = true,
  ...props
}) => {
  const getCardStyle = () => {
    const base = [styles.card];
    
    if (shadow) base.push(styles.cardWithShadow);
    
    // Variantes de color
    if (variant === 'servicio') base.push(styles.cardServicio);
    if (variant === 'proveedor') base.push(styles.cardProveedor);
    if (variant === 'solicitud') base.push(styles.cardSolicitud);
    if (variant === 'promocion') base.push(styles.cardPromocion);
    
    return base;
  };

  const CardComponent = onPress ? TouchableOpacity : View;

  return (
    <CardComponent
      style={[...getCardStyle(), style]}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
      {...props}
    >
      {children}
    </CardComponent>
  );
};

/**
 * COMPONENTE ESPECIALIZADO: CARD DE SERVICIO
 */
export const ServiceCard = ({
  title,
  description,
  price,
  duration,
  rating,
  image,
  onPress,
  onFavorite,
  isFavorite = false,
  style,
}) => {
  return (
    <Card variant="servicio" onPress={onPress} style={[styles.serviceCard, style]}>
      <View style={styles.serviceHeader}>
        <View style={styles.serviceInfo}>
          <Text style={styles.serviceTitle}>{title}</Text>
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {description}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.favoriteButton}
          onPress={onFavorite}
        >
          <Text style={[styles.favoriteIcon, isFavorite && styles.favoriteActive]}>
            ♥
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.serviceFooter}>
        <View style={styles.serviceDetails}>
          <Text style={styles.servicePrice}>${price}</Text>
          <Text style={styles.serviceDuration}>{duration}</Text>
        </View>
        {rating && (
          <View style={styles.ratingContainer}>
            <Text style={styles.ratingText}>★ {rating}</Text>
          </View>
        )}
      </View>
    </Card>
  );
};

/**
 * COMPONENTE ESPECIALIZADO: CARD DE PROVEEDOR
 */
export const ProviderCard = ({
  name,
  avatar,
  rating,
  reviews,
  distance,
  specialties,
  isVerified = false,
  onPress,
  style,
}) => {
  return (
    <Card variant="proveedor" onPress={onPress} style={[styles.providerCard, style]}>
      <View style={styles.providerHeader}>
        <View style={styles.avatarContainer}>
          {/* Avatar placeholder - reemplazar con imagen real */}
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {name ? name.charAt(0).toUpperCase() : 'U'}
            </Text>
          </View>
          {isVerified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedIcon}>✓</Text>
            </View>
          )}
        </View>
        
        <View style={styles.providerInfo}>
          <Text style={styles.providerName}>{name}</Text>
          <View style={styles.providerStats}>
            <Text style={styles.providerRating}>★ {rating}</Text>
            <Text style={styles.providerReviews}>({reviews} reseñas)</Text>
          </View>
          <Text style={styles.providerDistance}>{distance} km</Text>
        </View>
      </View>
      
      <View style={styles.specialtiesContainer}>
        {specialties?.map((specialty, index) => (
          <View key={index} style={styles.specialtyTag}>
            <Text style={styles.specialtyText}>{specialty}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
};

/**
 * COMPONENTE ESPECIALIZADO: CARD DE SOLICITUD
 */
export const RequestCard = ({
  service,
  status,
  scheduledDate,
  address,
  provider,
  onPress,
  onCancel,
  onTrack,
  style,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'PENDIENTE': return COLORS.WARNING;
      case 'CONFIRMADO': return COLORS.INFO;
      case 'EN_PROCESO': return COLORS.PRIMARY;
      case 'COMPLETADO': return COLORS.SUCCESS;
      case 'CANCELADO': return COLORS.ERROR;
      default: return COLORS.GRAY_DARK;
    }
  };

  return (
    <Card variant="solicitud" onPress={onPress} style={[styles.requestCard, style]}>
      <View style={styles.requestHeader}>
        <Text style={styles.requestService}>{service}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor() }]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>
      
      <View style={styles.requestDetails}>
        <Text style={styles.requestDate}>📅 {scheduledDate}</Text>
        <Text style={styles.requestAddress}>📍 {address}</Text>
        {provider && (
          <Text style={styles.requestProvider}>👤 {provider}</Text>
        )}
      </View>
      
      <View style={styles.requestActions}>
        {status !== 'CANCELADO' && status !== 'COMPLETADO' && (
          <TouchableOpacity style={styles.trackButton} onPress={onTrack}>
            <Text style={styles.trackButtonText}>Seguir</Text>
          </TouchableOpacity>
        )}
        {status === 'PENDIENTE' && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  // Card base
  card: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  
  cardWithShadow: {
    ...SHADOWS.MEDIUM,
  },
  
  // Variantes
  cardServicio: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.PRIMARY,
  },
  
  cardProveedor: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.SECONDARY,
  },
  
  cardSolicitud: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.WARNING,
  },
  
  cardPromocion: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.SUCCESS,
  },
  
  // ServiceCard específico
  serviceCard: {
    padding: SPACING.LG,
  },
  
  serviceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.MD,
  },
  
  serviceInfo: {
    flex: 1,
    marginRight: SPACING.MD,
  },
  
  serviceTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },
  
  serviceDescription: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    lineHeight: 18,
  },
  
  favoriteButton: {
    padding: SPACING.SM,
  },
  
  favoriteIcon: {
    fontSize: 20,
    color: COLORS.GRAY_MEDIUM,
  },
  
  favoriteActive: {
    color: COLORS.ERROR,
  },
  
  serviceFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  serviceDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  servicePrice: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginRight: SPACING.MD,
  },
  
  serviceDuration: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
  },
  
  ratingContainer: {
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  
  ratingText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  
  // ProviderCard específico
  providerCard: {
    padding: SPACING.LG,
  },
  
  providerHeader: {
    flexDirection: 'row',
    marginBottom: SPACING.MD,
  },
  
  avatarContainer: {
    position: 'relative',
    marginRight: SPACING.MD,
  },
  
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.SECONDARY,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  avatarText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.SUCCESS,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  verifiedIcon: {
    fontSize: 12,
    color: COLORS.WHITE,
    fontWeight: 'bold',
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
  
  providerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.XS,
  },
  
  providerRating: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.SUCCESS,
    marginRight: SPACING.SM,
  },
  
  providerReviews: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
  },
  
  providerDistance: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
  },
  
  specialtiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  
  specialtyTag: {
    backgroundColor: COLORS.GRAY_LIGHT,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    marginRight: SPACING.SM,
    marginBottom: SPACING.XS,
  },
  
  specialtyText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.DARK,
  },
  
  // RequestCard específico
  requestCard: {
    padding: SPACING.LG,
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
    textTransform: 'uppercase',
  },
  
  requestDetails: {
    marginBottom: SPACING.MD,
  },
  
  requestDate: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.XS,
  },
  
  requestAddress: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.XS,
  },
  
  requestProvider: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
  },
  
  requestActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  trackButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
  },
  
  trackButtonText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: COLORS.ERROR,
    paddingHorizontal: SPACING.LG,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
  },
  
  cancelButtonText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.ERROR,
    fontWeight: '600',
  },
});

export { Card as default };