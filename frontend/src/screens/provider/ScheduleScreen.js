import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  Modal,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { NavHeader, Card, Button, Input } from '../../components';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme';

/**
 * PANTALLA HORARIOS DEL PROVEEDOR
 * Funcionalidades:
 * - Configurar disponibilidad semanal
 * - Gestionar horarios especiales/excepciones
 * - Bloquear fechas específicas
 * - Configurar tipos de servicio por horario
 * - Vista de calendario con disponibilidad
 * - Solicitudes de cambio de horario
 */
const ScheduleScreen = ({ navigation }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerMode, setTimePickerMode] = useState('start'); // start, end
  const [tempTime, setTempTime] = useState(new Date());
  
  // Estados de horarios
  const [weeklySchedule, setWeeklySchedule] = useState({});
  const [specialDays, setSpecialDays] = useState([]);
  const [blockedDates, setBlockedDates] = useState([]);
  const [servicePreferences, setServicePreferences] = useState({});

  // Estados de modales
  const [showSpecialDayModal, setShowSpecialDayModal] = useState(false);
  const [showBlockDateModal, setShowBlockDateModal] = useState(false);
  const [showServicePrefsModal, setShowServicePrefsModal] = useState(false);

  const daysOfWeek = [
    { key: 'monday', name: 'Lunes', short: 'LUN' },
    { key: 'tuesday', name: 'Martes', short: 'MAR' },
    { key: 'wednesday', name: 'Miércoles', short: 'MIE' },
    { key: 'thursday', name: 'Jueves', short: 'JUE' },
    { key: 'friday', name: 'Viernes', short: 'VIE' },
    { key: 'saturday', name: 'Sábado', short: 'SAB' },
    { key: 'sunday', name: 'Domingo', short: 'DOM' },
  ];

  const serviceTypes = [
    { id: 'home_cleaning', name: 'Limpieza de Hogar', icon: '🏠' },
    { id: 'office_cleaning', name: 'Limpieza de Oficina', icon: '🏢' },
    { id: 'post_construction', name: 'Post-Construcción', icon: '🏗️' },
    { id: 'deep_cleaning', name: 'Limpieza Profunda', icon: '🧽' },
    { id: 'maintenance', name: 'Mantenimiento', icon: '🔧' },
  ];

  // Mock data inicial
  const mockWeeklySchedule = {
    monday: {
      available: true,
      startTime: '08:00',
      endTime: '17:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      maxServices: 3,
    },
    tuesday: {
      available: true,
      startTime: '08:00',
      endTime: '17:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      maxServices: 3,
    },
    wednesday: {
      available: true,
      startTime: '08:00',
      endTime: '17:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      maxServices: 3,
    },
    thursday: {
      available: true,
      startTime: '08:00',
      endTime: '17:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      maxServices: 3,
    },
    friday: {
      available: true,
      startTime: '08:00',
      endTime: '17:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      maxServices: 3,
    },
    saturday: {
      available: true,
      startTime: '09:00',
      endTime: '15:00',
      breakStart: '12:00',
      breakEnd: '13:00',
      maxServices: 2,
    },
    sunday: {
      available: false,
      startTime: null,
      endTime: null,
      breakStart: null,
      breakEnd: null,
      maxServices: 0,
    },
  };

  const mockSpecialDays = [
    {
      id: 'SPEC-001',
      date: '2024-02-14',
      type: 'EXTENDED', // EXTENDED, REDUCED, UNAVAILABLE
      reason: 'San Valentín - Horario extendido',
      startTime: '07:00',
      endTime: '20:00',
      maxServices: 5,
    },
    {
      id: 'SPEC-002',
      date: '2024-03-25',
      type: 'UNAVAILABLE',
      reason: 'Cita médica personal',
      startTime: null,
      endTime: null,
      maxServices: 0,
    },
  ];

  const mockBlockedDates = [
    {
      id: 'BLOCK-001',
      startDate: '2024-04-01',
      endDate: '2024-04-05',
      reason: 'Vacaciones familiares',
      type: 'VACATION',
    },
    {
      id: 'BLOCK-002',
      startDate: '2024-05-15',
      endDate: '2024-05-15',
      reason: 'Día personal',
      type: 'PERSONAL',
    },
  ];

  useEffect(() => {
    loadScheduleData();
  }, []);

  const loadScheduleData = async () => {
    setLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setWeeklySchedule(mockWeeklySchedule);
      setSpecialDays(mockSpecialDays);
      setBlockedDates(mockBlockedDates);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadScheduleData().finally(() => setRefreshing(false));
  }, []);

  const toggleDayAvailability = (dayKey) => {
    setWeeklySchedule(prev => ({
      ...prev,
      [dayKey]: {
        ...prev[dayKey],
        available: !prev[dayKey]?.available,
      },
    }));
  };

  const openTimePicker = (dayKey, mode) => {
    setSelectedDay(dayKey);
    setTimePickerMode(mode);
    const currentSchedule = weeklySchedule[dayKey];
    const currentTime = new Date();
    
    if (mode === 'start' && currentSchedule?.startTime) {
      const [hours, minutes] = currentSchedule.startTime.split(':');
      currentTime.setHours(parseInt(hours), parseInt(minutes));
    } else if (mode === 'end' && currentSchedule?.endTime) {
      const [hours, minutes] = currentSchedule.endTime.split(':');
      currentTime.setHours(parseInt(hours), parseInt(minutes));
    }
    
    setTempTime(currentTime);
    setShowTimePicker(true);
  };

  const handleTimeChange = (event, selectedTime) => {
    setShowTimePicker(false);
    
    if (selectedTime) {
      const timeString = selectedTime.toTimeString().slice(0, 5);
      
      setWeeklySchedule(prev => ({
        ...prev,
        [selectedDay]: {
          ...prev[selectedDay],
          [timePickerMode === 'start' ? 'startTime' : 'endTime']: timeString,
        },
      }));
    }
  };

  const saveScheduleChanges = async () => {
    try {
      // Aquí se enviarían los cambios al backend
      Alert.alert('Éxito', 'Horarios actualizados correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudieron guardar los cambios');
    }
  };

  const renderWeeklyScheduleDay = (day) => {
    const daySchedule = weeklySchedule[day.key];
    const isAvailable = daySchedule?.available;

    return (
      <Card key={day.key} style={styles.dayCard}>
        <View style={styles.dayHeader}>
          <View style={styles.dayInfo}>
            <Text style={styles.dayName}>{day.name}</Text>
            <Text style={[
              styles.dayStatus,
              { color: isAvailable ? COLORS.SUCCESS : COLORS.ERROR }
            ]}>
              {isAvailable ? '✅ Disponible' : '❌ No disponible'}
            </Text>
          </View>
          
          <TouchableOpacity
            onPress={() => toggleDayAvailability(day.key)}
            style={[
              styles.toggleButton,
              { backgroundColor: isAvailable ? COLORS.SUCCESS : COLORS.GRAY_DARK }
            ]}
          >
            <Text style={styles.toggleButtonText}>
              {isAvailable ? 'ON' : 'OFF'}
            </Text>
          </TouchableOpacity>
        </View>

        {isAvailable && daySchedule && (
          <View style={styles.daySchedule}>
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Horario:</Text>
              <View style={styles.timeInputs}>
                <TouchableOpacity
                  style={styles.timeInput}
                  onPress={() => openTimePicker(day.key, 'start')}
                >
                  <Text style={styles.timeText}>
                    {daySchedule.startTime || '08:00'}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.timeSeparator}>-</Text>
                <TouchableOpacity
                  style={styles.timeInput}
                  onPress={() => openTimePicker(day.key, 'end')}
                >
                  <Text style={styles.timeText}>
                    {daySchedule.endTime || '17:00'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
            
            {daySchedule.breakStart && (
              <View style={styles.timeRow}>
                <Text style={styles.timeLabel}>Descanso:</Text>
                <Text style={styles.breakTime}>
                  {daySchedule.breakStart} - {daySchedule.breakEnd}
                </Text>
              </View>
            )}
            
            <View style={styles.timeRow}>
              <Text style={styles.timeLabel}>Máx. servicios:</Text>
              <Text style={styles.maxServices}>
                {daySchedule.maxServices || 0}
              </Text>
            </View>
          </View>
        )}
      </Card>
    );
  };

  const renderSpecialDay = ({ item }) => (
    <Card style={styles.specialDayCard}>
      <View style={styles.specialDayHeader}>
        <View style={styles.specialDayInfo}>
          <Text style={styles.specialDayDate}>📅 {item.date}</Text>
          <Text style={styles.specialDayReason}>{item.reason}</Text>
        </View>
        <View style={[
          styles.specialDayType,
          { backgroundColor: getSpecialDayColor(item.type) }
        ]}>
          <Text style={styles.specialDayTypeText}>
            {getSpecialDayLabel(item.type)}
          </Text>
        </View>
      </View>
      
      {item.type !== 'UNAVAILABLE' && (
        <View style={styles.specialDaySchedule}>
          <Text style={styles.specialDayTime}>
            ⏰ {item.startTime} - {item.endTime}
          </Text>
          <Text style={styles.specialDayMaxServices}>
            📊 Máx. {item.maxServices} servicios
          </Text>
        </View>
      )}
    </Card>
  );

  const renderBlockedDate = ({ item }) => (
    <Card style={styles.blockedDateCard}>
      <View style={styles.blockedDateHeader}>
        <View style={styles.blockedDateInfo}>
          <Text style={styles.blockedDateRange}>
            🚫 {item.startDate === item.endDate ? item.startDate : `${item.startDate} - ${item.endDate}`}
          </Text>
          <Text style={styles.blockedDateReason}>{item.reason}</Text>
        </View>
        <View style={[
          styles.blockedDateType,
          { backgroundColor: item.type === 'VACATION' ? COLORS.PRIMARY : COLORS.WARNING }
        ]}>
          <Text style={styles.blockedDateTypeText}>
            {item.type === 'VACATION' ? 'VACACIONES' : 'PERSONAL'}
          </Text>
        </View>
      </View>
    </Card>
  );

  const getSpecialDayColor = (type) => {
    switch (type) {
      case 'EXTENDED': return COLORS.SUCCESS;
      case 'REDUCED': return COLORS.WARNING;
      case 'UNAVAILABLE': return COLORS.ERROR;
      default: return COLORS.GRAY_DARK;
    }
  };

  const getSpecialDayLabel = (type) => {
    switch (type) {
      case 'EXTENDED': return 'EXTENDIDO';
      case 'REDUCED': return 'REDUCIDO';
      case 'UNAVAILABLE': return 'NO DISPONIBLE';
      default: return type;
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando horarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavHeader
        title="Mis Horarios"
        onBack={() => navigation.goBack()}
        actions={
          <TouchableOpacity onPress={saveScheduleChanges}>
            <Text style={styles.saveIcon}>💾</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Horarios Semanales */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Horarios Semanales</Text>
          <Text style={styles.sectionSubtitle}>
            Configura tu disponibilidad para cada día de la semana
          </Text>
          
          {daysOfWeek.map(renderWeeklyScheduleDay)}
        </View>

        {/* Días Especiales */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>⭐ Días Especiales</Text>
            <Button
              title="Agregar"
              variant="outline"
              size="small"
              onPress={() => setShowSpecialDayModal(true)}
            />
          </View>
          
          <FlatList
            data={specialDays}
            renderItem={renderSpecialDay}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={() => (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  No hay días especiales configurados
                </Text>
              </Card>
            )}
          />
        </View>

        {/* Fechas Bloqueadas */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🚫 Fechas Bloqueadas</Text>
            <Button
              title="Bloquear"
              variant="outline"
              size="small"
              onPress={() => setShowBlockDateModal(true)}
            />
          </View>
          
          <FlatList
            data={blockedDates}
            renderItem={renderBlockedDate}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ListEmptyComponent={() => (
              <Card style={styles.emptyCard}>
                <Text style={styles.emptyText}>
                  No hay fechas bloqueadas
                </Text>
              </Card>
            )}
          />
        </View>

        {/* Preferencias de Servicio */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🏠 Tipos de Servicio</Text>
            <Button
              title="Configurar"
              variant="outline"
              size="small"
              onPress={() => setShowServicePrefsModal(true)}
            />
          </View>
          
          <Card style={styles.servicePrefsCard}>
            <Text style={styles.servicePrefsText}>
              Configura qué tipos de servicios ofreces y en qué horarios
            </Text>
            
            <View style={styles.serviceTypesList}>
              {serviceTypes.slice(0, 3).map(service => (
                <View key={service.id} style={styles.serviceTypeItem}>
                  <Text style={styles.serviceTypeIcon}>{service.icon}</Text>
                  <Text style={styles.serviceTypeName}>{service.name}</Text>
                  <View style={[styles.serviceTypeStatus, { backgroundColor: COLORS.SUCCESS }]}>
                    <Text style={styles.serviceTypeStatusText}>Activo</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        </View>

        {/* Estadísticas de Disponibilidad */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Resumen de Disponibilidad</Text>
          
          <View style={styles.statsGrid}>
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>40</Text>
              <Text style={styles.statLabel}>Horas/Semana</Text>
            </Card>
            
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>18</Text>
              <Text style={styles.statLabel}>Servicios/Semana</Text>
            </Card>
            
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>6</Text>
              <Text style={styles.statLabel}>Días Activos</Text>
            </Card>
            
            <Card style={styles.statCard}>
              <Text style={styles.statValue}>85%</Text>
              <Text style={styles.statLabel}>Ocupación</Text>
            </Card>
          </View>
        </View>

        {/* Acciones Rápidas */}
        <View style={styles.actionsSection}>
          <Button
            title="Configuración Avanzada"
            onPress={() => navigation.navigate('AdvancedScheduleSettings')}
            variant="outline"
            fullWidth
            style={styles.actionButton}
          />
          
          <Button
            title="Vista de Calendario"
            onPress={() => navigation.navigate('CalendarView')}
            variant="primary"
            fullWidth
            style={styles.actionButton}
          />
        </View>
      </ScrollView>

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={tempTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
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
  
  content: {
    flex: 1,
    paddingHorizontal: SPACING.MD,
  },
  
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  saveIcon: {
    fontSize: 20,
  },
  
  section: {
    marginBottom: SPACING.XL,
  },
  
  sectionTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.DARK,
    marginBottom: SPACING.SM,
  },
  
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.MD,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  
  // Días de la semana
  dayCard: {
    marginBottom: SPACING.MD,
  },
  
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  
  dayInfo: {
    flex: 1,
  },
  
  dayName: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  
  dayStatus: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    marginTop: SPACING.XS,
    fontWeight: '500',
  },
  
  toggleButton: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
  },
  
  toggleButtonText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
  },
  
  daySchedule: {
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
    paddingTop: SPACING.MD,
  },
  
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  
  timeLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    fontWeight: '500',
  },
  
  timeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  timeInput: {
    backgroundColor: COLORS.GRAY_LIGHT,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.SM,
    minWidth: 60,
    alignItems: 'center',
  },
  
  timeText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    fontWeight: '600',
  },
  
  timeSeparator: {
    marginHorizontal: SPACING.SM,
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.GRAY_DARK,
  },
  
  breakTime: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
  },
  
  maxServices: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  
  // Días especiales
  specialDayCard: {
    marginBottom: SPACING.MD,
  },
  
  specialDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  
  specialDayInfo: {
    flex: 1,
  },
  
  specialDayDate: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  
  specialDayReason: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  specialDayType: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    marginLeft: SPACING.MD,
  },
  
  specialDayTypeText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    fontWeight: '600',
  },
  
  specialDaySchedule: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  
  specialDayTime: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
  },
  
  specialDayMaxServices: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: '500',
  },
  
  // Fechas bloqueadas
  blockedDateCard: {
    marginBottom: SPACING.MD,
  },
  
  blockedDateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  
  blockedDateInfo: {
    flex: 1,
  },
  
  blockedDateRange: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  
  blockedDateReason: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  blockedDateType: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
    marginLeft: SPACING.MD,
  },
  
  blockedDateTypeText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    fontWeight: '600',
  },
  
  // Preferencias de servicio
  servicePrefsCard: {
    backgroundColor: COLORS.WHITE,
  },
  
  servicePrefsText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.MD,
    textAlign: 'center',
  },
  
  serviceTypesList: {
    marginTop: SPACING.MD,
  },
  
  serviceTypeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  
  serviceTypeIcon: {
    fontSize: 18,
    marginRight: SPACING.MD,
  },
  
  serviceTypeName: {
    flex: 1,
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    fontWeight: '500',
  },
  
  serviceTypeStatus: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: BORDER_RADIUS.SM,
  },
  
  serviceTypeStatusText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    fontWeight: '600',
  },
  
  // Estadísticas
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  
  statCard: {
    width: '48%',
    alignItems: 'center',
    marginBottom: SPACING.MD,
    paddingVertical: SPACING.LG,
  },
  
  statValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: '700',
    color: COLORS.PRIMARY,
    marginBottom: SPACING.XS,
  },
  
  statLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
  },
  
  // Estados vacíos
  emptyCard: {
    backgroundColor: COLORS.WHITE,
    alignItems: 'center',
    paddingVertical: SPACING.XL,
  },
  
  emptyText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
  },
  
  // Acciones
  actionsSection: {
    paddingBottom: SPACING.XL,
  },
  
  actionButton: {
    marginBottom: SPACING.MD,
  },
});

export default ScheduleScreen;