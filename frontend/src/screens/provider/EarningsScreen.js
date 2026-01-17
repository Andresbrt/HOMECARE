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
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { NavHeader, Card, Button } from '../../components';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme';

/**
 * PANTALLA GANANCIAS DEL PROVEEDOR
 * Funcionalidades:
 * - Dashboard de ingresos y estadísticas
 * - Gráficos de ganancias por período
 * - Historial de pagos detallado
 * - Métricas de rendimiento
 * - Exportar reportes
 * - Configuración de métodos de pago
 */
const EarningsScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, year
  const [earningsData, setEarningsData] = useState({});
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  const screenWidth = Dimensions.get('window').width;

  // Mock data de ganancias
  const mockEarningsData = {
    week: {
      totalEarnings: 1250000,
      totalJobs: 8,
      averageRating: 4.8,
      totalHours: 28.5,
      pendingPayments: 320000,
      paidAmount: 930000,
      chartData: [180, 220, 150, 280, 190, 240, 160],
      labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
      serviceTypes: [
        { name: 'Hogar Completo', earnings: 750000, jobs: 5, color: COLORS.PRIMARY },
        { name: 'Oficina', earnings: 300000, jobs: 2, color: COLORS.SECONDARY },
        { name: 'Post-Obra', earnings: 200000, jobs: 1, color: COLORS.SUCCESS },
      ],
    },
    month: {
      totalEarnings: 4850000,
      totalJobs: 32,
      averageRating: 4.9,
      totalHours: 115.5,
      pendingPayments: 680000,
      paidAmount: 4170000,
      chartData: [1200, 1100, 1350, 950, 1250],
      labels: ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4', 'Sem 5'],
      serviceTypes: [
        { name: 'Hogar Completo', earnings: 2900000, jobs: 20, color: COLORS.PRIMARY },
        { name: 'Oficina', earnings: 1200000, jobs: 8, color: COLORS.SECONDARY },
        { name: 'Post-Obra', earnings: 750000, jobs: 4, color: COLORS.SUCCESS },
      ],
    },
    year: {
      totalEarnings: 52500000,
      totalJobs: 385,
      averageRating: 4.7,
      totalHours: 1340,
      pendingPayments: 2100000,
      paidAmount: 50400000,
      chartData: [3200, 3800, 4100, 3900, 4200, 4600, 4800, 4300, 3700, 4100, 4500, 4200],
      labels: ['E', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'],
      serviceTypes: [
        { name: 'Hogar Completo', earnings: 31500000, jobs: 230, color: COLORS.PRIMARY },
        { name: 'Oficina', earnings: 14000000, jobs: 95, color: COLORS.SECONDARY },
        { name: 'Post-Obra', earnings: 7000000, jobs: 60, color: COLORS.SUCCESS },
      ],
    },
  };

  // Mock data del historial de pagos
  const mockPaymentHistory = [
    {
      id: 'PAY-2024-001',
      date: '2024-01-14',
      amount: 205000,
      status: 'PAGADO',
      services: [
        { id: 'SRV-001', client: 'Carlos Méndez', type: 'Limpieza Hogar', amount: 150000 },
        { id: 'SRV-002', client: 'Ana Torres', type: 'Limpieza Oficina', amount: 55000 },
      ],
      paymentMethod: 'Transferencia Bancaria',
      transactionId: 'TXN-789123456',
    },
    {
      id: 'PAY-2024-002',
      date: '2024-01-12',
      amount: 320000,
      status: 'PAGADO',
      services: [
        { id: 'SRV-003', client: 'Empresa XYZ', type: 'Limpieza Oficina Completa', amount: 320000 },
      ],
      paymentMethod: 'Transferencia Bancaria',
      transactionId: 'TXN-789123457',
    },
    {
      id: 'PAY-2024-003',
      date: '2024-01-10',
      amount: 180000,
      status: 'PENDIENTE',
      services: [
        { id: 'SRV-004', client: 'María González', type: 'Limpieza Post-Obra', amount: 180000 },
      ],
      paymentMethod: 'Pendiente',
      estimatedDate: '2024-01-17',
    },
  ];

  useEffect(() => {
    loadEarningsData();
  }, [selectedPeriod]);

  const loadEarningsData = async () => {
    setLoading(true);
    try {
      // Simular carga de datos
      await new Promise(resolve => setTimeout(resolve, 1000));
      setEarningsData(mockEarningsData[selectedPeriod]);
      setPaymentHistory(mockPaymentHistory);
    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadEarningsData().finally(() => setRefreshing(false));
  }, [selectedPeriod]);

  const formatCurrency = (amount) => {
    return `$${amount.toLocaleString()}`;
  };

  const chartConfig = {
    backgroundGradientFrom: COLORS.WHITE,
    backgroundGradientTo: COLORS.WHITE,
    color: (opacity = 1) => `rgba(73, 192, 188, ${opacity})`,
    strokeWidth: 3,
    barPercentage: 0.7,
    decimalPlaces: 0,
    propsForLabels: {
      fontSize: 12,
    },
  };

  const renderPeriodTab = (period, label) => (
    <TouchableOpacity
      key={period}
      style={[
        styles.periodTab,
        selectedPeriod === period && styles.periodTabActive,
      ]}
      onPress={() => setSelectedPeriod(period)}
    >
      <Text style={[
        styles.periodTabText,
        selectedPeriod === period && styles.periodTabTextActive,
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

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

  const renderPaymentItem = ({ item }) => (
    <Card style={styles.paymentCard}>
      <View style={styles.paymentHeader}>
        <View style={styles.paymentInfo}>
          <Text style={styles.paymentAmount}>{formatCurrency(item.amount)}</Text>
          <Text style={styles.paymentDate}>📅 {item.date}</Text>
        </View>
        <View style={[
          styles.paymentStatus,
          { backgroundColor: item.status === 'PAGADO' ? COLORS.SUCCESS : COLORS.WARNING }
        ]}>
          <Text style={styles.paymentStatusText}>
            {item.status === 'PAGADO' ? 'PAGADO' : 'PENDIENTE'}
          </Text>
        </View>
      </View>

      <View style={styles.paymentServices}>
        {item.services.map((service, index) => (
          <View key={index} style={styles.serviceItem}>
            <Text style={styles.serviceName}>• {service.type}</Text>
            <Text style={styles.serviceClient}>Cliente: {service.client}</Text>
            <Text style={styles.serviceAmount}>{formatCurrency(service.amount)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.paymentFooter}>
        <Text style={styles.paymentMethod}>
          💳 {item.paymentMethod}
        </Text>
        {item.transactionId && (
          <Text style={styles.transactionId}>
            ID: {item.transactionId}
          </Text>
        )}
        {item.estimatedDate && (
          <Text style={styles.estimatedDate}>
            Estimado: {item.estimatedDate}
          </Text>
        )}
      </View>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando datos de ganancias...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavHeader
        title="Mis Ganancias"
        onBack={() => navigation.goBack()}
        actions={
          <TouchableOpacity onPress={() => navigation.navigate('EarningsSettings')}>
            <Text style={styles.settingsIcon}>⚙️</Text>
          </TouchableOpacity>
        }
      />

      {/* Selector de Período */}
      <View style={styles.periodSelector}>
        {renderPeriodTab('week', 'Semana')}
        {renderPeriodTab('month', 'Mes')}
        {renderPeriodTab('year', 'Año')}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Métricas Principales */}
        <View style={styles.metricsGrid}>
          {renderMetricCard(
            'Ganancias Totales',
            formatCurrency(earningsData.totalEarnings || 0),
            `${earningsData.totalJobs || 0} servicios`,
            '💰',
            COLORS.SUCCESS
          )}
          {renderMetricCard(
            'Promedio por Servicio',
            formatCurrency(Math.round((earningsData.totalEarnings || 0) / (earningsData.totalJobs || 1))),
            `${earningsData.totalHours || 0}h trabajadas`,
            '📊',
            COLORS.PRIMARY
          )}
          {renderMetricCard(
            'Pagos Pendientes',
            formatCurrency(earningsData.pendingPayments || 0),
            'Por recibir',
            '⏳',
            COLORS.WARNING
          )}
          {renderMetricCard(
            'Calificación',
            `⭐ ${earningsData.averageRating || 0}`,
            'Promedio',
            '🏆',
            COLORS.SECONDARY
          )}
        </View>

        {/* Gráfico de Ganancias */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>
            📈 Ganancias {selectedPeriod === 'week' ? 'Semanales' : selectedPeriod === 'month' ? 'Mensuales' : 'Anuales'}
          </Text>
          {earningsData.chartData && (
            <LineChart
              data={{
                labels: earningsData.labels,
                datasets: [
                  {
                    data: earningsData.chartData.map(val => val / 1000), // Convertir a miles
                  },
                ],
              }}
              width={screenWidth - 60}
              height={220}
              chartConfig={chartConfig}
              style={styles.chart}
              formatYLabel={(value) => `${value}k`}
            />
          )}
        </Card>

        {/* Distribución por Tipo de Servicio */}
        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>🏠 Ganancias por Tipo de Servicio</Text>
          {earningsData.serviceTypes && (
            <>
              <PieChart
                data={earningsData.serviceTypes.map(service => ({
                  name: service.name,
                  population: service.earnings,
                  color: service.color,
                }))}
                width={screenWidth - 60}
                height={220}
                chartConfig={chartConfig}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                style={styles.chart}
              />
              
              <View style={styles.serviceTypesLegend}>
                {earningsData.serviceTypes.map((service, index) => (
                  <View key={index} style={styles.legendItem}>
                    <View style={[styles.legendColor, { backgroundColor: service.color }]} />
                    <View style={styles.legendInfo}>
                      <Text style={styles.legendName}>{service.name}</Text>
                      <Text style={styles.legendAmount}>
                        {formatCurrency(service.earnings)} • {service.jobs} trabajos
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </Card>

        {/* Resumen de Balance */}
        <Card style={styles.balanceCard}>
          <Text style={styles.sectionTitle}>💳 Resumen de Balance</Text>
          
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Total Ganado</Text>
            <Text style={styles.balanceValue}>
              {formatCurrency(earningsData.totalEarnings || 0)}
            </Text>
          </View>
          
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Pagos Recibidos</Text>
            <Text style={[styles.balanceValue, { color: COLORS.SUCCESS }]}>
              {formatCurrency(earningsData.paidAmount || 0)}
            </Text>
          </View>
          
          <View style={styles.balanceRow}>
            <Text style={styles.balanceLabel}>Pendiente por Cobrar</Text>
            <Text style={[styles.balanceValue, { color: COLORS.WARNING }]}>
              {formatCurrency(earningsData.pendingPayments || 0)}
            </Text>
          </View>
          
          <View style={[styles.balanceRow, styles.balanceTotal]}>
            <Text style={styles.balanceTotalLabel}>Balance Disponible</Text>
            <Text style={styles.balanceTotalValue}>
              {formatCurrency(earningsData.paidAmount || 0)}
            </Text>
          </View>
        </Card>

        {/* Historial de Pagos */}
        <View style={styles.paymentsSection}>
          <View style={styles.paymentsHeader}>
            <Text style={styles.sectionTitle}>💸 Historial de Pagos</Text>
            <TouchableOpacity onPress={() => navigation.navigate('FullPaymentHistory')}>
              <Text style={styles.seeAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={paymentHistory.slice(0, 3)} // Mostrar solo los últimos 3
            renderItem={renderPaymentItem}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
          />
        </View>

        {/* Acciones */}
        <View style={styles.actionsSection}>
          <Button
            title="Solicitar Retiro"
            onPress={() => navigation.navigate('WithdrawalRequest')}
            variant="primary"
            fullWidth
            style={styles.actionButton}
          />
          
          <View style={styles.secondaryActions}>
            <Button
              title="Exportar Reporte"
              onPress={() => navigation.navigate('ExportReport')}
              variant="outline"
              style={styles.secondaryActionButton}
            />
            <Button
              title="Métodos de Pago"
              onPress={() => navigation.navigate('PaymentMethods')}
              variant="outline"
              style={styles.secondaryActionButton}
            />
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
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  settingsIcon: {
    fontSize: 20,
  },
  
  // Selector de período
  periodSelector: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    padding: SPACING.XS,
    marginHorizontal: SPACING.MD,
    marginTop: SPACING.SM,
    marginBottom: SPACING.MD,
    borderRadius: BORDER_RADIUS.LG,
  },
  
  periodTab: {
    flex: 1,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
  },
  
  periodTabActive: {
    backgroundColor: COLORS.PRIMARY,
  },
  
  periodTabText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    fontWeight: '600',
  },
  
  periodTabTextActive: {
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
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
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
  
  // Leyenda de servicios
  serviceTypesLegend: {
    marginTop: SPACING.MD,
  },
  
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: SPACING.SM,
  },
  
  legendInfo: {
    flex: 1,
  },
  
  legendName: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  
  legendAmount: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  // Balance
  balanceCard: {
    marginBottom: SPACING.LG,
    backgroundColor: COLORS.WHITE,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.SUCCESS,
  },
  
  sectionTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.DARK,
    marginBottom: SPACING.MD,
  },
  
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
  },
  
  balanceLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
  },
  
  balanceValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  
  balanceTotal: {
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
    paddingTop: SPACING.MD,
    marginTop: SPACING.SM,
  },
  
  balanceTotalLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '700',
    color: COLORS.DARK,
  },
  
  balanceTotalValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.SUCCESS,
  },
  
  // Pagos
  paymentsSection: {
    marginBottom: SPACING.LG,
  },
  
  paymentsHeader: {
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
  
  paymentCard: {
    marginBottom: SPACING.MD,
  },
  
  paymentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  
  paymentInfo: {
    flex: 1,
  },
  
  paymentAmount: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },
  
  paymentDate: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  paymentStatus: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    marginLeft: SPACING.MD,
  },
  
  paymentStatusText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  
  paymentServices: {
    marginBottom: SPACING.MD,
  },
  
  serviceItem: {
    marginBottom: SPACING.SM,
  },
  
  serviceName: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  
  serviceClient: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  serviceAmount: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  
  paymentFooter: {
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
    paddingTop: SPACING.SM,
  },
  
  paymentMethod: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
  },
  
  transactionId: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  estimatedDate: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.WARNING,
    fontWeight: '600',
    marginTop: SPACING.XS,
  },
  
  // Acciones
  actionsSection: {
    paddingBottom: SPACING.XL,
  },
  
  actionButton: {
    marginBottom: SPACING.MD,
  },
  
  secondaryActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  secondaryActionButton: {
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
});

export default EarningsScreen;