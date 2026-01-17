import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { NavHeader, Button, Input, Card } from '../../components';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { requestService } from '../../services/requestService';

/**
 * PANTALLA SOLICITAR SERVICIO
 * Funcionalidades:
 * - Formulario completo de solicitud
 * - Selección de dirección
 * - Programación de fecha/hora
 * - Opciones adicionales
 * - Cálculo de precio final
 * - Integración con pagos
 */
const RequestServiceScreen = ({ navigation, route }) => {
  const { service, date, time, notes } = route.params || {};
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    title: service?.name || '',
    cleaningType: service?.type || 'RESIDENCIAL',
    address: '',
    addressDetails: '',
    contactPhone: user?.phone || '',
    alternateContact: '',
    preferredDate: date || '',
    preferredTime: time || '',
    duration: service?.duration || 2, // horas estimadas
    maxPrice: service?.price || 150000,
    additionalNotes: notes || '',
    urgentService: false,
    provideSupplies: false,
    needKeys: false,
    petFriendly: false,
    selectedExtras: [],
    latitude: null,
    longitude: null,
  });
  
  const [loading, setLoading] = useState(false);
  const [priceBreakdown, setPriceBreakdown] = useState({
    basePrice: service?.price || 150000,
    extras: 0,
    urgentFee: 0,
    suppliesFee: 0,
    total: service?.price || 150000,
  });

  // Tipos de limpieza disponibles
  const cleaningTypes = [
    { value: 'RESIDENCIAL', label: 'Casa/Apartamento' },
    { value: 'OFICINA', label: 'Oficina' },
    { value: 'COMERCIAL', label: 'Local Comercial' },
    { value: 'PROFUNDA', label: 'Limpieza Profunda' },
    { value: 'MUDANZA', label: 'Mudanza' },
    { value: 'POST_CONSTRUCCION', label: 'Post-construcción' },
  ];

  // Extras disponibles
  const availableExtras = [
    { id: 'deep_cleaning', name: 'Limpieza Profunda', price: 50000, description: 'Limpieza detallada de áreas difíciles' },
    { id: 'windows_exterior', name: 'Ventanas Exteriores', price: 30000, description: 'Limpieza de ventanas por fuera' },
    { id: 'carpet_cleaning', name: 'Limpieza de Alfombras', price: 40000, description: 'Aspirado y limpieza especializada' },
    { id: 'appliance_interior', name: 'Interior de Electrodomésticos', price: 25000, description: 'Horno, nevera, microondas' },
    { id: 'organize_closets', name: 'Organizar Closets', price: 35000, description: 'Organización de armarios y closets' },
  ];

  useEffect(() => {
    calculatePrice(formData);
  }, []);

  const updateFormData = (key, value) => {
    const newData = { ...formData, [key]: value };
    setFormData(newData);
    calculatePrice(newData);
  };

  const toggleExtra = (extraId) => {
    const selected = formData.selectedExtras.includes(extraId);
    const newExtras = selected
      ? formData.selectedExtras.filter(id => id !== extraId)
      : [...formData.selectedExtras, extraId];
    
    updateFormData('selectedExtras', newExtras);
  };

  const calculatePrice = (data) => {
    const basePrice = service?.price || 150000;
    const extrasPrice = data.selectedExtras.reduce((sum, extraId) => {
      const extra = availableExtras.find(e => e.id === extraId);
      return sum + (extra ? extra.price : 0);
    }, 0);
    const urgentFee = data.urgentService ? Math.round(basePrice * 0.3) : 0;
    const suppliesFee = data.provideSupplies ? 25000 : 0;
    
    const total = basePrice + extrasPrice + urgentFee + suppliesFee;
    
    setPriceBreakdown({
      basePrice,
      extras: extrasPrice,
      urgentFee,
      suppliesFee,
      total,
    });

    // Actualizar el precio máximo en el formulario
    setFormData(prev => ({
      ...prev,
      maxPrice: total
    }));
  };

  const validateForm = () => {
    const required = ['title', 'address', 'contactPhone', 'preferredDate', 'preferredTime'];
    const missing = required.filter(field => !formData[field]?.toString().trim());
    
    if (missing.length > 0) {
      Alert.alert('Campos Requeridos', 'Por favor completa todos los campos obligatorios.');
      return false;
    }
    
    return true;
  };

  const handleSubmitRequest = async () => {
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Preparar los datos de la solicitud según el formato del backend
      const requestData = {
        title: formData.title,
        description: buildDescription(),
        cleaningType: formData.cleaningType,
        address: formData.address,
        addressDetails: formData.addressDetails,
        latitude: formData.latitude || -4.5709, // Coordenadas por defecto
        longitude: formData.longitude || -74.2973,
        contactPhone: formData.contactPhone,
        alternateContact: formData.alternateContact,
        serviceDate: formData.preferredDate,
        startTime: formData.preferredTime,
        duration: formData.duration,
        maxPrice: formData.maxPrice,
        additionalNotes: formData.additionalNotes,
        urgentService: formData.urgentService,
        provideSupplies: formData.provideSupplies,
        needKeys: formData.needKeys,
        petFriendly: formData.petFriendly,
        extras: formData.selectedExtras.map(id => ({
          id,
          ...availableExtras.find(extra => extra.id === id)
        }))
      };
      
      // Crear la solicitud en el backend
      const response = await requestService.createRequest(requestData);
      
      Alert.alert(
        'Solicitud Creada',
        'Tu solicitud ha sido publicada exitosamente. Los proveedores podrán enviar ofertas.',
        [
          {
            text: 'Ver Solicitud',
            onPress: () => navigation.navigate('ServiceDetails', { 
              requestId: response.id 
            })
          }
        ]
      );
      
    } catch (error) {
      console.error('Error creating request:', error);
      Alert.alert(
        'Error',
        error.message || 'No se pudo crear la solicitud. Intenta nuevamente.'
      );
    } finally {
      setLoading(false);
    }
  };

  const buildDescription = () => {
    let description = `Solicitud de ${formData.cleaningType.toLowerCase()}`;
    
    if (formData.selectedExtras.length > 0) {
      const extrasNames = formData.selectedExtras.map(id => 
        availableExtras.find(extra => extra.id === id)?.name
      ).filter(Boolean);
      description += ` con servicios adicionales: ${extrasNames.join(', ')}`;
    }
    
    if (formData.urgentService) {
      description += '. Servicio urgente requerido';
    }
    
    if (formData.provideSupplies) {
      description += '. Proveedor debe llevar suministros';
    }
    
    if (formData.petFriendly) {
      description += '. Ambiente pet-friendly';
    }
    
    if (formData.needKeys) {
      description += '. Se entregarán llaves para acceso';
    }
    
    if (formData.additionalNotes) {
      description += `. Notas: ${formData.additionalNotes}`;
    }
    
    return description;
  };

  const renderExtra = (extra) => (
    <TouchableOpacity
      key={extra.id}
      style={[
        styles.extraItem,
        formData.selectedExtras.includes(extra.id) && styles.extraItemSelected,
      ]}
      onPress={() => toggleExtra(extra.id)}
    >
      <View style={styles.extraContent}>
        <Text style={[
          styles.extraName,
          formData.selectedExtras.includes(extra.id) && styles.extraNameSelected,
        ]}>
          {extra.name}
        </Text>
        <Text style={styles.extraDescription}>{extra.description}</Text>
      </View>
      <Text style={[
        styles.extraPrice,
        formData.selectedExtras.includes(extra.id) && styles.extraPriceSelected,
      ]}>
        +${extra.price.toLocaleString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <NavHeader
        title="Solicitar Servicio"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Información del Servicio */}
        <Card style={styles.serviceInfoCard}>
          <Text style={styles.serviceName}>{service?.title || 'Limpieza Completa del Hogar'}</Text>
          <Text style={styles.serviceDescription}>{service?.description || 'Servicio de limpieza integral'}</Text>
        </Card>

        {/* Información Básica */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>📝 Información Básica</Text>
          
          <Input
            label="Título de la Solicitud *"
            value={formData.title}
            onChangeText={(value) => updateFormData('title', value)}
            placeholder="Ej: Limpieza completa apartamento 2 habitaciones"
          />

          {/* Selector de tipo de limpieza */}
          <Text style={styles.inputLabel}>Tipo de Limpieza *</Text>
          <View style={styles.cleaningTypeContainer}>
            {cleaningTypes.map((type) => (
              <TouchableOpacity
                key={type.value}
                style={[
                  styles.cleaningTypeOption,
                  formData.cleaningType === type.value && styles.cleaningTypeSelected,
                ]}
                onPress={() => updateFormData('cleaningType', type.value)}
              >
                <Text style={[
                  styles.cleaningTypeText,
                  formData.cleaningType === type.value && styles.cleaningTypeTextSelected,
                ]}>
                  {type.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label="Duración Estimada (horas)"
            value={formData.duration.toString()}
            onChangeText={(value) => updateFormData('duration', parseInt(value) || 2)}
            placeholder="2"
            keyboardType="numeric"
          />
        </Card>

        {/* Información de Contacto */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>📍 Dirección del Servicio</Text>
          
          <Input
            label="Dirección Principal *"
            value={formData.address}
            onChangeText={(value) => updateFormData('address', value)}
            placeholder="Ej: Calle 123 #45-67, Bogotá"
          />
          
          <Input
            label="Detalles de Acceso"
            value={formData.addressDetails}
            onChangeText={(value) => updateFormData('addressDetails', value)}
            placeholder="Apartamento, torre, portería, etc."
            multiline
            numberOfLines={2}
          />
          
          <Input
            label="Teléfono de Contacto *"
            value={formData.contactPhone}
            onChangeText={(value) => updateFormData('contactPhone', value)}
            placeholder="+57 300 123 4567"
            keyboardType="phone-pad"
            mask="phone"
          />
          
          <Input
            label="Contacto Alternativo"
            value={formData.alternateContact}
            onChangeText={(value) => updateFormData('alternateContact', value)}
            placeholder="Nombre y teléfono de contacto alternativo"
          />
        </Card>

        {/* Programación */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>📅 Programación</Text>
          
          <Input
            label="Fecha Preferida *"
            value={formData.preferredDate}
            onChangeText={(value) => updateFormData('preferredDate', value)}
            placeholder="DD/MM/YYYY"
            mask="date"
          />
          
          <Input
            label="Hora Preferida *"
            value={formData.preferredTime}
            onChangeText={(value) => updateFormData('preferredTime', value)}
            placeholder="HH:MM AM/PM"
          />
          
          <View style={styles.checkboxSection}>
            <TouchableOpacity
              style={styles.checkboxItem}
              onPress={() => updateFormData('urgentService', !formData.urgentService)}
            >
              <View style={[styles.checkbox, formData.urgentService && styles.checkboxChecked]}>
                {formData.urgentService && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.checkboxContent}>
                <Text style={styles.checkboxLabel}>Servicio Urgente (+30%)</Text>
                <Text style={styles.checkboxDescription}>Servicio en las próximas 2-4 horas</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Opciones Adicionales */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>⚙️ Opciones Adicionales</Text>
          
          <View style={styles.checkboxSection}>
            <TouchableOpacity
              style={styles.checkboxItem}
              onPress={() => updateFormData('provideSupplies', !formData.provideSupplies)}
            >
              <View style={[styles.checkbox, formData.provideSupplies && styles.checkboxChecked]}>
                {formData.provideSupplies && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.checkboxContent}>
                <Text style={styles.checkboxLabel}>Incluir Productos de Limpieza (+$25.000)</Text>
                <Text style={styles.checkboxDescription}>Llevamos todos los productos necesarios</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.checkboxItem}
              onPress={() => updateFormData('needKeys', !formData.needKeys)}
            >
              <View style={[styles.checkbox, formData.needKeys && styles.checkboxChecked]}>
                {formData.needKeys && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.checkboxContent}>
                <Text style={styles.checkboxLabel}>Necesito Entrega de Llaves</Text>
                <Text style={styles.checkboxDescription}>El proveedor puede recoger/entregar llaves</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.checkboxItem}
              onPress={() => updateFormData('petFriendly', !formData.petFriendly)}
            >
              <View style={[styles.checkbox, formData.petFriendly && styles.checkboxChecked]}>
                {formData.petFriendly && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <View style={styles.checkboxContent}>
                <Text style={styles.checkboxLabel}>Tengo Mascotas</Text>
                <Text style={styles.checkboxDescription}>Informar al proveedor sobre mascotas en casa</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Servicios Extras */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>✨ Servicios Adicionales</Text>
          <Text style={styles.sectionSubtitle}>Selecciona servicios extras para personalizar tu limpieza</Text>
          
          {availableExtras.map(renderExtra)}
        </Card>

        {/* Notas Adicionales */}
        <Card style={styles.formCard}>
          <Text style={styles.sectionTitle}>📝 Notas Especiales</Text>
          
          <Input
            label="Instrucciones Adicionales"
            value={formData.additionalNotes}
            onChangeText={(value) => updateFormData('additionalNotes', value)}
            placeholder="Instrucciones especiales, áreas de enfoque, restricciones, etc."
            multiline
            numberOfLines={4}
          />
        </Card>

        {/* Resumen de Precios */}
        <Card style={styles.priceCard}>
          <Text style={styles.sectionTitle}>💰 Resumen de Costos</Text>
          
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Servicio Base</Text>
            <Text style={styles.priceValue}>${priceBreakdown.basePrice.toLocaleString()}</Text>
          </View>
          
          {priceBreakdown.extras > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Servicios Extras</Text>
              <Text style={styles.priceValue}>+${priceBreakdown.extras.toLocaleString()}</Text>
            </View>
          )}
          
          {priceBreakdown.urgentFee > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Recargo Urgente (30%)</Text>
              <Text style={styles.priceValue}>+${priceBreakdown.urgentFee.toLocaleString()}</Text>
            </View>
          )}
          
          {priceBreakdown.suppliesFee > 0 && (
            <View style={styles.priceRow}>
              <Text style={styles.priceLabel}>Productos de Limpieza</Text>
              <Text style={styles.priceValue}>+${priceBreakdown.suppliesFee.toLocaleString()}</Text>
            </View>
          )}
          
          <View style={[styles.priceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total Máximo</Text>
            <Text style={styles.totalValue}>${priceBreakdown.total.toLocaleString()}</Text>
          </View>
          
          <Text style={styles.priceNote}>
            Este es el precio máximo que pagarás. Los proveedores pueden ofrecer precios menores.
          </Text>
        </Card>

        {/* Botón de Envío */}
        <View style={styles.submitContainer}>
          <Button
            title={loading ? 'Publicando...' : 'Publicar Solicitud'}
            onPress={handleSubmitRequest}
            loading={loading}
            disabled={loading}
            variant="primary"
            size="large"
            fullWidth
          />
          
          <Text style={styles.submitNote}>
            Al publicar tu solicitud, los proveedores cercanos podrán enviarte ofertas.
          </Text>
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
  
  // Información del servicio
  serviceInfoCard: {
    marginTop: SPACING.MD,
    marginBottom: SPACING.MD,
    backgroundColor: COLORS.PRIMARY,
  },
  
  serviceName: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '600',
    color: COLORS.WHITE,
    marginBottom: SPACING.XS,
  },
  
  serviceDescription: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.WHITE,
    opacity: 0.9,
  },
  
  // Formulario
  formCard: {
    marginBottom: SPACING.MD,
  },
  
  sectionTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.MD,
  },
  
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.MD,
  },
  
  // Checkboxes
  checkboxSection: {
    marginTop: SPACING.SM,
  },
  
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.MD,
  },
  
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: COLORS.GRAY_MEDIUM,
    borderRadius: 4,
    marginRight: SPACING.MD,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  
  checkboxChecked: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },
  
  checkmark: {
    color: COLORS.WHITE,
    fontSize: 14,
    fontWeight: '600',
  },
  
  checkboxContent: {
    flex: 1,
  },
  
  checkboxLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  
  checkboxDescription: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  // Extras
  extraItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.MD,
    marginBottom: SPACING.SM,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY_MEDIUM,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: COLORS.WHITE,
  },
  
  extraItemSelected: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: COLORS.PRIMARY + '10',
  },
  
  extraContent: {
    flex: 1,
    marginRight: SPACING.MD,
  },
  
  extraName: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  
  extraNameSelected: {
    color: COLORS.PRIMARY,
  },
  
  extraDescription: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  
  extraPrice: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.GRAY_DARK,
  },
  
  extraPriceSelected: {
    color: COLORS.PRIMARY,
  },
  
  // Precios
  priceCard: {
    marginBottom: SPACING.MD,
    backgroundColor: COLORS.WHITE,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.SUCCESS,
  },
  
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
  },
  
  priceLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
  },
  
  priceValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.DARK,
  },
  
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
    paddingTop: SPACING.MD,
    marginTop: SPACING.SM,
  },
  
  totalLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '700',
    color: COLORS.DARK,
  },
  
  totalValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.SUCCESS,
  },

  priceNote: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
    marginTop: SPACING.SM,
    fontStyle: 'italic',
  },
  
  // Submit
  submitContainer: {
    paddingVertical: SPACING.XL,
  },

  submitNote: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
    marginTop: SPACING.MD,
  },

  // Input styles
  inputLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.SM,
  },

  // Cleaning type selector
  cleaningTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.LG,
  },

  cleaningTypeOption: {
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: BORDER_RADIUS.LG,
    borderWidth: 1,
    borderColor: COLORS.GRAY_MEDIUM,
    marginRight: SPACING.SM,
    marginBottom: SPACING.SM,
    backgroundColor: COLORS.WHITE,
  },

  cleaningTypeSelected: {
    backgroundColor: COLORS.PRIMARY,
    borderColor: COLORS.PRIMARY,
  },

  cleaningTypeText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    fontWeight: '500',
  },

  cleaningTypeTextSelected: {
    color: COLORS.WHITE,
    fontWeight: '600',
  },
});

export default RequestServiceScreen;