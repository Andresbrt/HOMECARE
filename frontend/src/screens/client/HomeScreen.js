import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
} from 'react-native';
import { MainHeader, ServiceCard, Card, Button } from '../components';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../theme';

/**
 * PANTALLA PRINCIPAL DEL CLIENTE
 * Funcionalidades:
 * - Servicios disponibles
 * - Búsqueda rápida
 * - Promociones activas
 * - Solicitudes recientes
 * - Acceso rápido a funciones
 */
const ClientHomeScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [services, setServices] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [user, setUser] = useState({
    name: 'Carlos Mendez',
    location: 'Bogotá, Colombia',
    notifications: 3,
  });

  // Servicios disponibles (mock data)
  const availableServices = [
    {
      id: '1',
      title: 'Limpieza Completa del Hogar',
      description: 'Servicio integral de limpieza para tu casa. Incluye baños, cocina, habitaciones.',
      price: '150.000',
      duration: '3-4 horas',
      rating: 4.8,
      category: 'hogar',
    },
    {
      id: '2', 
      title: 'Limpieza de Oficina',
      description: 'Limpieza profesional para espacios de trabajo. Desinfección incluida.',
      price: '200.000',
      duration: '2-3 horas',
      rating: 4.9,
      category: 'oficina',
    },
    {
      id: '3',
      title: 'Limpieza Post-Construcción',
      description: 'Limpieza especializada después de obras. Incluye ventanas y escombros.',
      price: '300.000',
      duration: '5-6 horas',
      rating: 4.7,
      category: 'construccion',
    },
    {
      id: '4',
      title: 'Limpieza de Ventanas',
      description: 'Servicio especializado en limpieza de cristales y ventanas.',
      price: '80.000',
      duration: '1-2 horas',
      rating: 4.6,
      category: 'ventanas',
    },
  ];

  // Promociones activas (mock data)
  const activePromotions = [
    {
      id: 'p1',
      title: '20% OFF Primera Limpieza',
      description: 'Descuento especial para nuevos clientes',
      discount: '20%',
      validUntil: '2024-02-28',
      code: 'NUEVO20',
    },
    {
      id: 'p2',
      title: 'Paquete 3x2 Mensual',
      description: 'Contrata 3 limpiezas y paga solo 2',
      discount: '33%',
      validUntil: '2024-03-15',
      code: 'PACK3X2',
    },
  ];

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simular carga de datos
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const handleServicePress = (service) => {
    navigation.navigate('ServiceDetails', { service });
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'emergency':
        navigation.navigate('EmergencyService');
        break;
      case 'schedule':
        navigation.navigate('ScheduleService');
        break;
      case 'track':
        navigation.navigate('TrackService');
        break;
      case 'history':
        navigation.navigate('ServiceHistory');
        break;
    }
  };

  const renderService = ({ item }) => (
    <ServiceCard
      title={item.title}
      description={item.description}
      price={item.price}
      duration={item.duration}
      rating={item.rating}
      onPress={() => handleServicePress(item)}
      style={styles.serviceItem}
    />
  );

  const renderPromotion = ({ item }) => (
    <Card variant="promocion" style={styles.promotionCard}>
      <View style={styles.promotionHeader}>
        <Text style={styles.promotionTitle}>{item.title}</Text>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>{item.discount}</Text>
        </View>
      </View>
      <Text style={styles.promotionDescription}>{item.description}</Text>
      <View style={styles.promotionFooter}>
        <Text style={styles.promotionCode}>Código: {item.code}</Text>
        <Text style={styles.promotionValid}>Válido hasta {item.validUntil}</Text>
      </View>
    </Card>
  );

  return (
    <View style={styles.container}>
      {/* Header Principal */}
      <MainHeader
        userName={user.name}
        notifications={user.notifications}
        currentLocation={user.location}
        onProfilePress={() => navigation.navigate('Profile')}
        onNotificationsPress={() => navigation.navigate('Notifications')}
        onLocationPress={() => navigation.navigate('LocationSelector')}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Acciones Rápidas */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickActionItem, styles.emergencyAction]}
            onPress={() => handleQuickAction('emergency')}
          >
            <Text style={styles.quickActionIcon}>🚨</Text>
            <Text style={styles.quickActionText}>Servicio Urgente</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => handleQuickAction('schedule')}
          >
            <Text style={styles.quickActionIcon}>📅</Text>
            <Text style={styles.quickActionText}>Programar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => handleQuickAction('track')}
          >
            <Text style={styles.quickActionIcon}>📍</Text>
            <Text style={styles.quickActionText}>Seguir Servicio</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.quickActionItem}
            onPress={() => handleQuickAction('history')}
          >
            <Text style={styles.quickActionIcon}>📝</Text>
            <Text style={styles.quickActionText}>Historial</Text>
          </TouchableOpacity>
        </View>

        {/* Promociones Activas */}
        {activePromotions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🎉 Ofertas Especiales</Text>
            <FlatList
              data={activePromotions}
              renderItem={renderPromotion}
              keyExtractor={(item) => item.id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.promotionsList}
            />
          </View>
        )}

        {/* Servicios Disponibles */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏠 Servicios Disponibles</Text>
            <TouchableOpacity onPress={() => navigation.navigate('AllServices')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={availableServices}
            renderItem={renderService}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* Búsqueda Rápida por Categoría */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔍 Buscar por Categoría</Text>
          <View style={styles.categoriesGrid}>
            {[
              { id: 'hogar', name: 'Hogar', icon: '🏡' },
              { id: 'oficina', name: 'Oficina', icon: '🏢' },
              { id: 'construccion', name: 'Post-Obra', icon: '🔨' },
              { id: 'ventanas', name: 'Ventanas', icon: '🪟' },
              { id: 'vehiculos', name: 'Vehículos', icon: '🚗' },
              { id: 'eventos', name: 'Eventos', icon: '🎪' },
            ].map((category) => (
              <TouchableOpacity
                key={category.id}
                style={styles.categoryItem}
                onPress={() => navigation.navigate('CategoryServices', { category })}
              >
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryName}>{category.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Botón CTA Principal */}
        <View style={styles.ctaSection}>
          <Button
            title="Solicitar Limpieza Ahora"
            onPress={() => navigation.navigate('RequestService')}
            variant="primary"
            size="large"
            fullWidth
          />
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
  
  // Acciones Rápidas
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.LG,
    marginBottom: SPACING.LG,
  },
  
  quickActionItem: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    paddingVertical: SPACING.LG,
    alignItems: 'center',
    marginHorizontal: SPACING.XS,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  emergencyAction: {
    backgroundColor: COLORS.ERROR,
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
  
  // Servicios
  serviceItem: {
    marginBottom: SPACING.MD,
  },
  
  // Promociones
  promotionsList: {
    paddingRight: SPACING.MD,
  },
  
  promotionCard: {
    width: 280,
    marginRight: SPACING.MD,
    padding: SPACING.LG,
  },
  
  promotionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  
  promotionTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
    flex: 1,
  },
  
  discountBadge: {
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  
  discountText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.WHITE,
    fontWeight: '700',
  },
  
  promotionDescription: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.MD,
  },
  
  promotionFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
    paddingTop: SPACING.SM,
  },
  
  promotionCode: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  
  promotionValid: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  // Categorías
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  categoryItem: {
    width: '30%',
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.MD,
    paddingVertical: SPACING.LG,
    alignItems: 'center',
    marginBottom: SPACING.MD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  
  categoryIcon: {
    fontSize: 32,
    marginBottom: SPACING.SM,
  },
  
  categoryName: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  // CTA Section
  ctaSection: {
    marginVertical: SPACING.XXL,
  },
});

export default ClientHomeScreen;