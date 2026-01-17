import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { NavHeader, Button, Card, Input } from '../../components';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS, DIMENSIONS } from '../../theme';

/**
 * PANTALLA SERVICIO ACTIVO DEL PROVEEDOR
 * Funcionalidades:
 * - Gestión completa del servicio en progreso
 * - Mapa con ubicación del cliente
 * - Timeline de progreso del servicio
 * - Chat con el cliente
 * - Reporte de progreso y fotos
 * - Finalización del servicio
 */
const ActiveServiceScreen = ({ navigation, route }) => {
  const { service: initialService } = route.params || {};
  
  const [service, setService] = useState(null);
  const [currentStatus, setCurrentStatus] = useState('CONFIRMADO');
  const [progressNotes, setProgressNotes] = useState('');
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // Mock data del servicio activo
  const mockActiveService = initialService || {
    id: 'SRV-2024-005',
    client: {
      id: 'CLI-001',
      name: 'Carlos Méndez',
      phone: '+57 300 123 4567',
      rating: 4.5,
      location: {
        latitude: 4.6097,
        longitude: -74.0817,
      },
    },
    serviceType: 'Limpieza Completa del Hogar',
    address: 'Calle 127 #15-30, Apartamento 502',
    addressDetails: 'Torre B - Portería principal - Código 1502',
    scheduledDate: '2024-01-15',
    scheduledTime: '14:00',
    estimatedDuration: '3 horas',
    price: 150000,
    extras: [
      { name: 'Limpieza de ventanas exteriores', price: 30000 },
      { name: 'Productos de limpieza incluidos', price: 25000 },
    ],
    totalPrice: 205000,
    specialInstructions: 'Tener cuidado con el gato (se asusta fácilmente). Llaves con la portera.',
    timeline: [
      { status: 'CONFIRMADO', time: '12:30', completed: true, label: 'Servicio Confirmado' },
      { status: 'EN_CAMINO', time: '13:45', completed: true, label: 'En Camino al Cliente' },
      { status: 'LLEGUE', time: '14:00', completed: true, label: 'Llegué al Lugar' },
      { status: 'INICIADO', time: '14:15', completed: false, label: 'Servicio Iniciado' },
      { status: 'PROGRESO_50', time: '', completed: false, label: 'Progreso 50%' },
      { status: 'CASI_TERMINADO', time: '', completed: false, label: 'Casi Terminado' },
      { status: 'COMPLETADO', time: '', completed: false, label: 'Servicio Completado' },
    ],
    materials: [
      'Aspiradora',
      'Productos de limpieza multiuso',
      'Limpiador de vidrios',
      'Trapos de microfibra',
      'Guantes desechables',
    ],
  };

  useEffect(() => {
    loadServiceData();
  }, []);

  const loadServiceData = async () => {
    setLoading(true);
    try {
      // Simular carga de datos del servicio
      await new Promise(resolve => setTimeout(resolve, 1000));
      setService(mockActiveService);
      
      // Determinar estado actual basado en el timeline
      const lastCompleted = mockActiveService.timeline.findIndex(item => !item.completed);
      if (lastCompleted > 0) {
        setCurrentStatus(mockActiveService.timeline[lastCompleted - 1].status);
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la información del servicio');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = (newStatus) => {
    const statusIndex = service.timeline.findIndex(item => item.status === newStatus);
    if (statusIndex === -1) return;

    // Actualizar timeline
    const updatedTimeline = service.timeline.map((item, index) => ({
      ...item,
      completed: index <= statusIndex,
      time: index === statusIndex && !item.time ? new Date().toLocaleTimeString('es-ES', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }) : item.time,
    }));

    setService(prev => ({
      ...prev,
      timeline: updatedTimeline,
    }));

    setCurrentStatus(newStatus);
    setShowStatusModal(false);

    // Notificación al cliente
    console.log(`Estado actualizado a: ${newStatus}`);
  };

  const handleCallClient = () => {
    Alert.alert(
      'Llamar Cliente',
      `¿Deseas llamar a ${service.client.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Llamar', onPress: () => console.log('Llamando...') },
      ]
    );
  };

  const handleChatClient = () => {
    navigation.navigate('Chat', {
      clientId: service.client.id,
      clientName: service.client.name,
      serviceId: service.id,
    });
  };

  const handleReportProgress = () => {
    setShowReportModal(true);
  };

  const submitProgressReport = () => {
    if (!progressNotes.trim()) {
      Alert.alert('Nota Requerida', 'Por favor agrega una nota sobre el progreso');
      return;
    }

    // Simular envío de reporte
    console.log('Enviando reporte de progreso:', progressNotes);
    setShowReportModal(false);
    setProgressNotes('');
    
    Alert.alert('Reporte Enviado', 'El cliente ha sido notificado del progreso');
  };

  const handleCompleteService = () => {
    Alert.alert(
      'Completar Servicio',
      '¿Estás seguro de que has completado todo el servicio?',
      [
        { text: 'No, aún no', style: 'cancel' },
        {
          text: 'Sí, Completar',
          onPress: () => {
            handleStatusUpdate('COMPLETADO');
            navigation.navigate('ServiceCompletion', { service });
          },
        },
      ]
    );
  };

  const handleEmergency = () => {
    Alert.alert(
      'Situación de Emergencia',
      'Selecciona el tipo de emergencia:',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Problema con Cliente', onPress: () => console.log('Problema con cliente') },
        { text: 'Accidente', style: 'destructive', onPress: () => console.log('Accidente reportado') },
        { text: 'No puedo acceder', onPress: () => console.log('Problema de acceso') },
      ]
    );
  };

  const getNextStatus = () => {
    const currentIndex = service?.timeline.findIndex(item => item.status === currentStatus);
    if (currentIndex !== -1 && currentIndex < service.timeline.length - 1) {
      return service.timeline[currentIndex + 1];
    }
    return null;
  };

  const getCompletedPercentage = () => {
    const completedSteps = service?.timeline.filter(item => item.completed).length || 0;
    const totalSteps = service?.timeline.length || 1;
    return Math.round((completedSteps / totalSteps) * 100);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Cargando servicio...</Text>
      </View>
    );
  }

  if (!service) {
    return (
      <View style={styles.errorContainer}>
        <Text>Error al cargar el servicio</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavHeader
        title="Servicio Activo"
        onBack={() => navigation.goBack()}
        actions={
          <TouchableOpacity onPress={handleEmergency} style={styles.emergencyButton}>
            <Text style={styles.emergencyIcon}>🚨</Text>
          </TouchableOpacity>
        }
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Mapa de Ubicación */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            provider={PROVIDER_GOOGLE}
            initialRegion={{
              latitude: service.client.location.latitude,
              longitude: service.client.location.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            showsUserLocation={true}
          >
            <Marker
              coordinate={service.client.location}
              title={service.client.name}
              description={service.address}
              pinColor={COLORS.PRIMARY}
            />
          </MapView>
        </View>

        {/* Información del Cliente */}
        <Card style={styles.clientCard}>
          <View style={styles.clientHeader}>
            <View style={styles.clientAvatar}>
              <Text style={styles.clientAvatarText}>
                {service.client.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.clientInfo}>
              <Text style={styles.clientName}>{service.client.name}</Text>
              <Text style={styles.clientRating}>⭐ {service.client.rating}</Text>
              <Text style={styles.clientAddress}>{service.address}</Text>
            </View>
          </View>
          
          <View style={styles.clientActions}>
            <Button
              title="Llamar"
              onPress={handleCallClient}
              variant="outline"
              size="small"
              style={styles.clientActionButton}
            />
            <Button
              title="Chat"
              onPress={handleChatClient}
              variant="primary"
              size="small"
              style={styles.clientActionButton}
            />
          </View>
        </Card>

        {/* Progreso del Servicio */}
        <Card style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressTitle}>Progreso del Servicio</Text>
            <Text style={styles.progressPercentage}>{getCompletedPercentage()}%</Text>
          </View>
          
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${getCompletedPercentage()}%` }]} />
          </View>
          
          <View style={styles.timeline}>
            {service.timeline.map((step, index) => (
              <View key={index} style={styles.timelineStep}>
                <View style={[
                  styles.timelineIndicator,
                  step.completed && styles.timelineIndicatorCompleted,
                  step.status === currentStatus && styles.timelineIndicatorCurrent,
                ]} />
                <View style={styles.timelineContent}>
                  <Text style={[
                    styles.timelineLabel,
                    step.completed && styles.timelineLabelCompleted,
                  ]}>
                    {step.label}
                  </Text>
                  {step.time && (
                    <Text style={styles.timelineTime}>{step.time}</Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Detalles del Servicio */}
        <Card style={styles.serviceCard}>
          <Text style={styles.sectionTitle}>📋 Detalles del Servicio</Text>
          
          <View style={styles.serviceDetail}>
            <Text style={styles.detailLabel}>Tipo:</Text>
            <Text style={styles.detailValue}>{service.serviceType}</Text>
          </View>
          
          <View style={styles.serviceDetail}>
            <Text style={styles.detailLabel}>Fecha/Hora:</Text>
            <Text style={styles.detailValue}>
              {service.scheduledDate} a las {service.scheduledTime}
            </Text>
          </View>
          
          <View style={styles.serviceDetail}>
            <Text style={styles.detailLabel}>Duración:</Text>
            <Text style={styles.detailValue}>{service.estimatedDuration}</Text>
          </View>
          
          <View style={styles.serviceDetail}>
            <Text style={styles.detailLabel}>Precio:</Text>
            <Text style={styles.detailValue}>${service.totalPrice.toLocaleString()}</Text>
          </View>

          {service.specialInstructions && (
            <View style={styles.instructionsSection}>
              <Text style={styles.instructionsTitle}>Instrucciones Especiales:</Text>
              <Text style={styles.instructionsText}>{service.specialInstructions}</Text>
            </View>
          )}
        </Card>

        {/* Acciones Rápidas */}
        <View style={styles.quickActions}>
          <TouchableOpacity style={styles.quickAction} onPress={handleReportProgress}>
            <Text style={styles.quickActionIcon}>📝</Text>
            <Text style={styles.quickActionText}>Reportar Progreso</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => setShowStatusModal(true)}>
            <Text style={styles.quickActionIcon}>📍</Text>
            <Text style={styles.quickActionText}>Actualizar Estado</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.quickAction} onPress={() => console.log('Tomar foto')}>
            <Text style={styles.quickActionIcon}>📷</Text>
            <Text style={styles.quickActionText}>Tomar Foto</Text>
          </TouchableOpacity>
        </View>

        {/* Botón de Finalizar */}
        {currentStatus !== 'COMPLETADO' && (
          <View style={styles.completeSection}>
            <Button
              title="Completar Servicio"
              onPress={handleCompleteService}
              variant="primary"
              size="large"
              fullWidth
            />
          </View>
        )}
      </ScrollView>

      {/* Modal de Actualización de Estado */}
      <Modal
        visible={showStatusModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Actualizar Estado</Text>
            <Text style={styles.modalSubtitle}>Selecciona el nuevo estado del servicio:</Text>
            
            {service.timeline.map((step, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.statusOption,
                  step.completed && styles.statusOptionCompleted,
                  step.status === currentStatus && styles.statusOptionCurrent,
                ]}
                onPress={() => handleStatusUpdate(step.status)}
                disabled={step.completed}
              >
                <Text style={[
                  styles.statusOptionText,
                  step.completed && styles.statusOptionTextCompleted,
                  step.status === currentStatus && styles.statusOptionTextCurrent,
                ]}>
                  {step.label}
                </Text>
              </TouchableOpacity>
            ))}
            
            <Button
              title="Cancelar"
              onPress={() => setShowStatusModal(false)}
              variant="outline"
              style={styles.modalCancelButton}
            />
          </View>
        </View>
      </Modal>

      {/* Modal de Reporte de Progreso */}
      <Modal
        visible={showReportModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowReportModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Reportar Progreso</Text>
            <Text style={styles.modalSubtitle}>Escribe una nota para el cliente:</Text>
            
            <Input
              label="Descripción del Progreso"
              value={progressNotes}
              onChangeText={setProgressNotes}
              placeholder="Ej: He terminado la sala y el comedor, ahora voy con las habitaciones..."
              multiline
              numberOfLines={4}
            />
            
            <View style={styles.modalActions}>
              <Button
                title="Cancelar"
                onPress={() => setShowReportModal(false)}
                variant="outline"
                style={styles.modalActionButton}
              />
              <Button
                title="Enviar Reporte"
                onPress={submitProgressReport}
                variant="primary"
                style={styles.modalActionButton}
              />
            </View>
          </View>
        </View>
      </Modal>
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
  
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  emergencyButton: {
    padding: SPACING.SM,
  },
  
  emergencyIcon: {
    fontSize: 20,
  },
  
  // Mapa
  mapContainer: {
    height: 200,
    borderRadius: BORDER_RADIUS.LG,
    overflow: 'hidden',
    marginTop: SPACING.MD,
    marginBottom: SPACING.MD,
  },
  
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  
  // Cliente
  clientCard: {
    marginBottom: SPACING.MD,
  },
  
  clientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  
  clientAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.PRIMARY,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.MD,
  },
  
  clientAvatarText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  
  clientInfo: {
    flex: 1,
  },
  
  clientName: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  
  clientRating: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  clientAddress: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  clientActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  
  clientActionButton: {
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
  
  // Progreso
  progressCard: {
    marginBottom: SPACING.MD,
  },
  
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  
  progressTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  
  progressPercentage: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.SUCCESS,
  },
  
  progressBar: {
    height: 8,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: 4,
    marginBottom: SPACING.LG,
  },
  
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.SUCCESS,
    borderRadius: 4,
  },
  
  // Timeline
  timeline: {
    marginTop: SPACING.MD,
  },
  
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  
  timelineIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.GRAY_MEDIUM,
    marginRight: SPACING.MD,
  },
  
  timelineIndicatorCompleted: {
    backgroundColor: COLORS.SUCCESS,
  },
  
  timelineIndicatorCurrent: {
    backgroundColor: COLORS.PRIMARY,
  },
  
  timelineContent: {
    flex: 1,
  },
  
  timelineLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
  },
  
  timelineLabelCompleted: {
    color: COLORS.DARK,
    fontWeight: '600',
  },
  
  timelineTime: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  // Detalles del servicio
  serviceCard: {
    marginBottom: SPACING.MD,
  },
  
  sectionTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.MD,
  },
  
  serviceDetail: {
    flexDirection: 'row',
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
    flex: 2,
    fontWeight: '500',
  },
  
  instructionsSection: {
    marginTop: SPACING.MD,
    padding: SPACING.MD,
    backgroundColor: COLORS.GRAY_LIGHT,
    borderRadius: BORDER_RADIUS.SM,
  },
  
  instructionsTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.SM,
  },
  
  instructionsText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    lineHeight: 18,
  },
  
  // Acciones rápidas
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.LG,
  },
  
  quickAction: {
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
  
  // Completar servicio
  completeSection: {
    paddingVertical: SPACING.XL,
  },
  
  // Modales
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  modalContent: {
    backgroundColor: COLORS.WHITE,
    borderRadius: BORDER_RADIUS.LG,
    padding: SPACING.XL,
    margin: SPACING.LG,
    width: '90%',
    maxHeight: '80%',
  },
  
  modalTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.SM,
    textAlign: 'center',
  },
  
  modalSubtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.LG,
    textAlign: 'center',
  },
  
  modalCancelButton: {
    marginTop: SPACING.LG,
  },
  
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.LG,
  },
  
  modalActionButton: {
    flex: 1,
    marginHorizontal: SPACING.XS,
  },
  
  // Opciones de estado
  statusOption: {
    padding: SPACING.MD,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: COLORS.GRAY_LIGHT,
    marginBottom: SPACING.SM,
  },
  
  statusOptionCompleted: {
    backgroundColor: COLORS.SUCCESS + '20',
  },
  
  statusOptionCurrent: {
    backgroundColor: COLORS.PRIMARY + '20',
    borderWidth: 2,
    borderColor: COLORS.PRIMARY,
  },
  
  statusOptionText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
  },
  
  statusOptionTextCompleted: {
    color: COLORS.SUCCESS,
    fontWeight: '600',
  },
  
  statusOptionTextCurrent: {
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
});

export default ActiveServiceScreen;