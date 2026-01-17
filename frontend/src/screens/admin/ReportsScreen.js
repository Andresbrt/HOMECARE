import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Alert,
  ActivityIndicator
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../theme';
import { reportsService } from '../../services/reportsService';

const { width } = Dimensions.get('window');

const ReportsScreen = () => {
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('week');
  const [reportData, setReportData] = useState({
    revenue: 0,
    services: 0,
    newUsers: 0,
    providerRating: 0,
    topServices: [],
    revenueChart: [],
    userGrowth: []
  });

  useEffect(() => {
    loadReports();
  }, [selectedPeriod]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const data = await reportsService.getReports(selectedPeriod);
      setReportData(data);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los reportes');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    try {
      await reportsService.exportReport(selectedPeriod);
      Alert.alert('Éxito', 'Reporte exportado correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo exportar el reporte');
    }
  };

  const periods = [
    { key: 'week', label: 'Semana' },
    { key: 'month', label: 'Mes' },
    { key: 'quarter', label: 'Trimestre' },
    { key: 'year', label: 'Año' }
  ];

  const MetricCard = ({ title, value, subtitle, icon, color }) => (
    <View style={[styles.metricCard, { borderLeftColor: color }]}>
      <View style={styles.metricHeader}>
        <Text style={styles.metricIcon}>{icon}</Text>
        <Text style={styles.metricTitle}>{title}</Text>
      </View>
      <Text style={[styles.metricValue, { color }]}>{value}</Text>
      <Text style={styles.metricSubtitle}>{subtitle}</Text>
    </View>
  );

  const ChartBar = ({ label, value, maxValue, color }) => {
    const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
    return (
      <View style={styles.chartBarContainer}>
        <Text style={styles.chartLabel}>{label}</Text>
        <View style={styles.chartBarBackground}>
          <View 
            style={[
              styles.chartBarFill, 
              { width: `${percentage}%`, backgroundColor: color }
            ]} 
          />
        </View>
        <Text style={styles.chartValue}>{value}</Text>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Cargando reportes...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Reportes y Análisis</Text>
        <TouchableOpacity style={styles.exportButton} onPress={exportReport}>
          <Text style={styles.exportButtonText}>📊 Exportar</Text>
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {periods.map((period) => (
            <TouchableOpacity
              key={period.key}
              style={[
                styles.periodButton,
                selectedPeriod === period.key && styles.periodButtonActive
              ]}
              onPress={() => setSelectedPeriod(period.key)}
            >
              <Text style={[
                styles.periodButtonText,
                selectedPeriod === period.key && styles.periodButtonTextActive
              ]}>
                {period.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Key Metrics */}
      <View style={styles.metricsContainer}>
        <MetricCard
          title="Ingresos Totales"
          value={`$${reportData.revenue.toLocaleString()}`}
          subtitle="En este período"
          icon="💰"
          color={COLORS.SUCCESS}
        />
        <MetricCard
          title="Servicios Completados"
          value={reportData.services.toString()}
          subtitle="Servicios realizados"
          icon="✅"
          color={COLORS.PRIMARY}
        />
        <MetricCard
          title="Nuevos Usuarios"
          value={reportData.newUsers.toString()}
          subtitle="Registros nuevos"
          icon="👥"
          color={COLORS.SECONDARY}
        />
        <MetricCard
          title="Calificación Promedio"
          value={reportData.providerRating.toFixed(1)}
          subtitle="Satisfacción general"
          icon="⭐"
          color={COLORS.WARNING}
        />
      </View>

      {/* Top Services Chart */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Servicios Más Solicitados</Text>
        {reportData.topServices.map((service, index) => (
          <ChartBar
            key={index}
            label={service.name}
            value={service.count}
            maxValue={Math.max(...reportData.topServices.map(s => s.count))}
            color={COLORS.PRIMARY}
          />
        ))}
      </View>

      {/* Revenue Trend */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Tendencia de Ingresos</Text>
        <View style={styles.trendChart}>
          {reportData.revenueChart.map((item, index) => (
            <View key={index} style={styles.trendItem}>
              <View style={styles.trendBar}>
                <View 
                  style={[
                    styles.trendBarFill,
                    { 
                      height: `${(item.value / Math.max(...reportData.revenueChart.map(r => r.value))) * 100}%`,
                      backgroundColor: COLORS.SUCCESS 
                    }
                  ]}
                />
              </View>
              <Text style={styles.trendLabel}>{item.period}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* User Growth */}
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>Crecimiento de Usuarios</Text>
        <View style={styles.userGrowthContainer}>
          {reportData.userGrowth.map((growth, index) => (
            <View key={index} style={styles.growthItem}>
              <Text style={styles.growthPeriod}>{growth.period}</Text>
              <View style={styles.growthStats}>
                <View style={styles.growthStat}>
                  <Text style={styles.growthNumber}>{growth.customers}</Text>
                  <Text style={styles.growthLabel}>Clientes</Text>
                </View>
                <View style={styles.growthStat}>
                  <Text style={styles.growthNumber}>{growth.providers}</Text>
                  <Text style={styles.growthLabel}>Proveedores</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Additional Metrics */}
      <View style={styles.additionalMetrics}>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Tasa de Conversión:</Text>
          <Text style={styles.metricValueText}>8.5%</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Tiempo Promedio de Servicio:</Text>
          <Text style={styles.metricValueText}>2.3 horas</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Servicios Cancelados:</Text>
          <Text style={styles.metricValueText}>3.2%</Text>
        </View>
        <View style={styles.metricRow}>
          <Text style={styles.metricLabel}>Retención de Usuarios:</Text>
          <Text style={styles.metricValueText}>76.8%</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Próximamente', 'Análisis detallado disponible pronto')}>
          <Text style={styles.actionButtonText}>📈 Análisis Detallado</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Próximamente', 'Configuración de alertas disponible pronto')}>
          <Text style={styles.actionButtonText}>🔔 Configurar Alertas</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.LIGHT_GRAY,
  },
  contentContainer: {
    paddingBottom: SPACING.XL,
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.WHITE,
    padding: SPACING.LG,
  },
  title: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  exportButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 8,
  },
  exportButtonText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
  },
  periodSelector: {
    backgroundColor: COLORS.WHITE,
    paddingVertical: SPACING.MD,
    paddingHorizontal: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  periodButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    marginRight: SPACING.SM,
    borderRadius: 20,
    backgroundColor: COLORS.LIGHT_GRAY,
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
  metricsContainer: {
    padding: SPACING.MD,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    backgroundColor: COLORS.WHITE,
    width: (width - SPACING.MD * 3) / 2,
    padding: SPACING.MD,
    borderRadius: 12,
    marginBottom: SPACING.MD,
    borderLeftWidth: 4,
  },
  metricHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  metricIcon: {
    fontSize: 20,
    marginRight: SPACING.SM,
  },
  metricTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    fontWeight: '600',
    flex: 1,
  },
  metricValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: 'bold',
    marginBottom: SPACING.XS,
  },
  metricSubtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
  },
  chartContainer: {
    backgroundColor: COLORS.WHITE,
    margin: SPACING.MD,
    padding: SPACING.LG,
    borderRadius: 12,
  },
  chartTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: SPACING.LG,
  },
  chartBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  chartLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    width: 80,
    marginRight: SPACING.SM,
  },
  chartBarBackground: {
    flex: 1,
    height: 20,
    backgroundColor: COLORS.LIGHT_GRAY,
    borderRadius: 10,
    overflow: 'hidden',
  },
  chartBarFill: {
    height: '100%',
    borderRadius: 10,
  },
  chartValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    fontWeight: 'bold',
    marginLeft: SPACING.SM,
    width: 30,
  },
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    marginVertical: SPACING.MD,
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
  },
  trendBar: {
    width: 20,
    height: 80,
    backgroundColor: COLORS.LIGHT_GRAY,
    borderRadius: 10,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    marginBottom: SPACING.SM,
  },
  trendBarFill: {
    width: '100%',
    borderRadius: 10,
  },
  trendLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
  },
  userGrowthContainer: {
    gap: SPACING.MD,
  },
  growthItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  growthPeriod: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  growthStats: {
    flexDirection: 'row',
    gap: SPACING.LG,
  },
  growthStat: {
    alignItems: 'center',
  },
  growthNumber: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  growthLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
  },
  additionalMetrics: {
    backgroundColor: COLORS.WHITE,
    margin: SPACING.MD,
    padding: SPACING.LG,
    borderRadius: 12,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  metricLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.DARK,
  },
  metricValueText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    gap: SPACING.MD,
  },
  actionButton: {
    flex: 1,
    backgroundColor: COLORS.SECONDARY,
    padding: SPACING.MD,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
  },
});

export default ReportsScreen;