import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { BarChart, LineChart, PieChart } from 'react-native-chart-kit';
import { MainHeader, Card, Button } from '../../components';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme';

/**
 * DASHBOARD ADMINISTRATIVO
 * Funcionalidades:
 * - Métricas en tiempo real
 * - Gráficos de analytics
 * - Gestión de usuarios
 * - Reportes financieros
 * - Herramientas de administración
 */
const AdminDashboardScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('today'); // today, week, month
  const [dashboardData, setDashboardData] = useState({});

  const screenWidth = Dimensions.get('window').width;

  // Mock data para métricas
  const mockDashboardData = {
    overview: {
      totalUsers: 1247,
      activeProviders: 89,
      todayBookings: 45,
      revenue: 12450000,
      averageRating: 4.7,
      completionRate: 94.2,
    },
    recentActivity: [
      {
        id: '1',
        type: 'booking',
        description: 'Nueva reserva de limpieza completa',
        user: 'Carlos Mendez',
        time: '2 min ago',
        amount: 150000,
      },
      {
        id: '2',
        type: 'provider',
        description: 'Nuevo proveedor registrado',
        user: 'Ana Rodríguez',
        time: '15 min ago',
        amount: null,
      },
      {
        id: '3',
        type: 'payment',
        description: 'Pago procesado exitosamente',
        user: 'Sistema Wompi',
        time: '23 min ago',
        amount: 200000,
      },
    ],
    charts: {
      revenue: [65, 59, 80, 81, 56, 55, 40],
      bookings: [28, 48, 40, 19, 86, 27, 90],
      providers: [
        { name: 'Activos', population: 89, color: COLORS.SUCCESS },
        { name: 'Inactivos', population: 23, color: COLORS.GRAY_MEDIUM },
        { name: 'Nuevos', population: 15, color: COLORS.PRIMARY },
      ],
    },
  };

  useEffect(() => {
    loadDashboardData();
  }, [selectedPeriod]);

  const loadDashboardData = () => {
    setDashboardData(mockDashboardData);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    setTimeout(() => {
      loadDashboardData();
      setRefreshing(false);
    }, 2000);
  }, []);

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  const renderMetricCard = (title, value, subtitle, icon, color = COLORS.PRIMARY) => (
    <Card style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricIcon}>{icon}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.metricSubtitle}>{subtitle}</Text>}
    </Card>
  );

  const renderActivityItem = ({ item }) => (
    <View style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: getActivityColor(item.type) }]}>
        <Text style={styles.activityIconText}>{getActivityIcon(item.type)}</Text>
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityDescription}>{item.description}</Text>
        <Text style={styles.activityUser}>{item.user}</Text>
        <Text style={styles.activityTime}>{item.time}</Text>
      </View>
      {item.amount && (
        <Text style={styles.activityAmount}>{formatCurrency(item.amount)}</Text>
      )}
    </View>
  );

  const getActivityColor = (type) => {
    switch (type) {
      case 'booking': return COLORS.PRIMARY;
      case 'provider': return COLORS.SUCCESS;
      case 'payment': return COLORS.WARNING;
      default: return COLORS.GRAY_MEDIUM;
    }
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'booking': return '📅';
      case 'provider': return '👤';
      case 'payment': return '💰';
      default: return '📌';
    }
  };

  const chartConfig = {
    backgroundGradientFrom: COLORS.WHITE,
    backgroundGradientTo: COLORS.WHITE,
    color: (opacity = 1) => `rgba(73, 192, 188, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.7,
    decimalPlaces: 0,
  };

  return (
    <View style={styles.container}>
      {/* Header Principal */}
      <MainHeader
        userName="Administrador"
        notifications={5}
        currentLocation="Dashboard"
        onProfilePress={() => navigation.navigate('AdminProfile')}
        onNotificationsPress={() => navigation.navigate('AdminNotifications')}
        onLocationPress={() => {}}
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Selector de Período */}
        <View style={styles.periodSelector}>
          {[
            { key: 'today', label: 'Hoy' },
            { key: 'week', label: 'Semana' },
            { key: 'month', label: 'Mes' },
          ].map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive,
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text
                style={[
                  styles.periodButtonText,
                  selectedPeriod === period.key && styles.periodButtonTextActive,
                ]}
              >
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Métricas Principales */}
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            'Usuarios Totales',
            dashboardData.overview?.totalUsers?.toLocaleString(),
            '+5.2% vs ayer',
            '👥',
            COLORS.PRIMARY
          )}
          {renderMetricCard(
            'Proveedores Activos',
            dashboardData.overview?.activeProviders,
            '89/112 disponibles',
            '⚡',
            COLORS.SUCCESS
          )}
          {renderMetricCard(
            'Reservas Hoy',
            dashboardData.overview?.todayBookings,
            '+12% vs ayer',
            '📅',
            COLORS.WARNING
          )}
          {renderMetricCard(
            'Ingresos',
            formatCurrency(dashboardData.overview?.revenue || 0),
            'Hoy',
            '💰',
            COLORS.SECONDARY
          )}
        </View>

        {/* Gráfico de Ingresos */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>📈 Ingresos (Últimos 7 días)</Text>
          {dashboardData.charts?.revenue && (
            <LineChart
              data={{
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [
                  {
                    data: dashboardData.charts.revenue,
                  },
                ],
              }}
              width={screenWidth - 60}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
            />
          )}
        </Card>

        {/* Gráfico de Reservas */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>📊 Reservas por Día</Text>
          {dashboardData.charts?.bookings && (
            <BarChart
              data={{
                labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
                datasets: [
                  {
                    data: dashboardData.charts.bookings,
                  },
                ],
              }}
              width={screenWidth - 60}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
            />
          )}
        </Card>

        {/* Distribución de Proveedores */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>👥 Estado de Proveedores</Text>
          {dashboardData.charts?.providers && (
            <PieChart
              data={dashboardData.charts.providers}
              width={screenWidth - 60}
              height={220}
              chartConfig={chartConfig}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              style={styles.chart}
            />
          )}
        </Card>

        {/* Actividad Reciente */}
        <Card style={styles.activityCard}>
          <Text style={styles.sectionTitle}>🔔 Actividad Reciente</Text>
          <FlatList
            data={dashboardData.recentActivity}
            renderItem={renderActivityItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </Card>

        {/* Acciones Administrativas */}
        <View style={styles.adminActions}>
          <Text style={styles.sectionTitle}>⚙️ Herramientas de Administración</Text>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('UserManagement')}
            >
              <Text style={styles.actionIcon}>👤</Text>
              <Text style={styles.actionText}>Gestionar Usuarios</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('ProviderManagement')}
            >
              <Text style={styles.actionIcon}>🔧</Text>
              <Text style={styles.actionText}>Gestionar Proveedores</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('FinancialReports')}
            >
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionText}>Reportes Financieros</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('SystemSettings')}
            >
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionText}>Configuración</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('SupportTickets')}
            >
              <Text style={styles.actionIcon}>📞</Text>
              <Text style={styles.actionText}>Soporte</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => navigation.navigate('Analytics')}
            >
              <Text style={styles.actionIcon}>📊</Text>
              <Text style={styles.actionText}>Analytics</Text>
            </TouchableOpacity>
          </View>
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
  
  // Selector de período
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.XS,
    marginTop: SPACING.LG,
    marginBottom: SPACING.LG,
  },
  
  periodButton: {
    flex: 1,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
  },
  
  periodButtonActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  
  periodButtonText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    fontWeight: '600',
  },
  
  periodButtonTextActive: {
    color: COLORS.WHITE,
  },
  
  // Métricas
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: SPACING.LG,
  },
  
  metricCard: {
    width: '48%',
    marginBottom: SPACING.MD,
    borderLeftWidth: 4,
  },
  
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  
  metricIcon: {
    fontSize: 18,
    marginRight: SPACING.SM,
  },
  
  metricTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    fontWeight: '600',
  },
  
  metricValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: '700',
    marginBottom: SPACING.XS,
  },
  
  metricSubtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
  },
  
  // Gráficos
  chartCard: {
    marginBottom: SPACING.LG,
  },
  
  chartTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.MD,
  },
  
  chart: {
    borderRadius: BORDER_RADIUS.MD,
  },
  
  // Actividad
  activityCard: {
    marginBottom: SPACING.LG,
  },
  
  sectionTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.DARK,
    marginBottom: SPACING.MD,
  },
  
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  
  activityIconText: {
    fontSize: 16,
  },
  
  activityContent: {
    flex: 1,
  },
  
  activityDescription: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    fontWeight: '600',
  },
  
  activityUser: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  activityTime: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
  },
  
  activityAmount: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  
  // Acciones administrativas
  adminActions: {
    marginBottom: SPACING.XL,
  },
  
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  actionButton: {
    width: '48%',
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    paddingVertical: SPACING.LG,
    alignItems: 'center',
    marginBottom: SPACING.MD,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  
  actionIcon: {
    fontSize: 24,
    marginBottom: SPACING.SM,
  },
  
  actionText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default AdminDashboardScreen;