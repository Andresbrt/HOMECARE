import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { NavHeader, Button, Card, Input } from '../../components';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { requestService } from '../../services/requestService';
import { paymentService } from '../../services/paymentService';

/**
 * PANTALLA DE PAGO INTEGRADA CON WOMPI
 * Maneja todo el flujo de pago del servicio
 */
const PaymentScreen = ({ navigation, route }) => {
  const { requestId, amount, providerName } = route.params || {};
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [selectedMethod, setSelectedMethod] = useState(null);
  const [cardModalVisible, setCardModalVisible] = useState(false);
  const [cardForm, setCardForm] = useState({
    number: '',
    expiry: '',
    cvc: '',
    holderName: '',
  });

  // Estados de pago
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [paymentResult, setPaymentResult] = useState(null);

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = async () => {
    setLoading(true);
    try {
      const methods = await paymentService.getPaymentMethods();
      setPaymentMethods(methods);
      
      // Seleccionar método por defecto si existe
      if (methods.length > 0) {
        setSelectedMethod(methods[0]);
      }
    } catch (error) {
      console.error('Error loading payment methods:', error);
      Alert.alert('Error', 'No se pudieron cargar los métodos de pago');
    } finally {
      setLoading(false);
    }
  };

  const handleAddCard = () => {
    setCardModalVisible(true);
  };

  const handleSaveCard = async () => {
    if (!cardForm.number || !cardForm.expiry || !cardForm.cvc || !cardForm.holderName) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    setLoading(true);
    try {
      const newMethod = await paymentService.savePaymentMethod({
        type: 'card',
        cardNumber: cardForm.number.replace(/\s/g, ''),
        expiryMonth: cardForm.expiry.split('/')[0],
        expiryYear: `20${cardForm.expiry.split('/')[1]}`,
        cvc: cardForm.cvc,
        holderName: cardForm.holderName,
      });

      setPaymentMethods([...paymentMethods, newMethod]);
      setSelectedMethod(newMethod);
      setCardModalVisible(false);
      setCardForm({
        number: '',
        expiry: '',
        cvc: '',
        holderName: '',
      });
      
      Alert.alert('Éxito', 'Tarjeta agregada exitosamente');
    } catch (error) {
      console.error('Error saving card:', error);
      Alert.alert('Error', 'No se pudo agregar la tarjeta');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (text) => {
    // Formatear número de tarjeta con espacios
    return text
      .replace(/\s/g, '')
      .replace(/(.{4})/g, '$1 ')
      .trim()
      .substring(0, 19);
  };

  const formatExpiry = (text) => {
    // Formatear fecha de vencimiento MM/YY
    const numbers = text.replace(/\D/g, '');
    if (numbers.length >= 2) {
      return `${numbers.substring(0, 2)}/${numbers.substring(2, 4)}`;
    }
    return numbers;
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      Alert.alert('Error', 'Por favor selecciona un método de pago');
      return;
    }

    Alert.alert(
      'Confirmar Pago',
      `¿Estás seguro de que quieres proceder con el pago de $${amount.toLocaleString()} para ${providerName}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Pagar',
          onPress: processPayment,
        }
      ]
    );
  };

  const processPayment = async () => {
    setPaymentProcessing(true);
    try {
      const paymentData = {
        requestId,
        amount,
        paymentMethodId: selectedMethod.id,
        currency: 'COP',
        description: `Pago por servicio de limpieza - ${providerName}`,
        customerEmail: user.email,
      };

      const result = await paymentService.processPayment(paymentData);
      
      if (result.status === 'APPROVED') {
        setPaymentResult({
          success: true,
          transactionId: result.transactionId,
          message: 'Pago procesado exitosamente',
        });

        // Actualizar estado de la solicitud
        await requestService.markAsCompleted(requestId);
        
        // Navegar a pantalla de confirmación después de un delay
        setTimeout(() => {
          navigation.replace('PaymentConfirmation', {
            success: true,
            transactionId: result.transactionId,
            amount,
            providerName,
          });
        }, 2000);
        
      } else if (result.status === 'PENDING') {
        setPaymentResult({
          success: false,
          pending: true,
          message: 'El pago está siendo procesado. Te notificaremos cuando se complete.',
        });
        
        setTimeout(() => {
          navigation.replace('PaymentConfirmation', {
            pending: true,
            transactionId: result.transactionId,
            amount,
            providerName,
          });
        }, 2000);
        
      } else {
        throw new Error(result.message || 'El pago fue rechazado');
      }

    } catch (error) {
      console.error('Payment error:', error);
      setPaymentResult({
        success: false,
        message: error.message || 'Error al procesar el pago',
      });
      
      setTimeout(() => {
        setPaymentResult(null);
        setPaymentProcessing(false);
      }, 3000);
    }
  };

  const renderPaymentMethod = (method) => (
    <TouchableOpacity
      key={method.id}
      style={[
        styles.paymentMethodCard,
        selectedMethod?.id === method.id && styles.selectedPaymentMethod
      ]}
      onPress={() => setSelectedMethod(method)}
    >
      <View style={styles.methodHeader}>
        <Text style={styles.methodIcon}>
          {method.type === 'card' ? '💳' : '🏦'}
        </Text>
        <View style={styles.methodInfo}>
          <Text style={styles.methodTitle}>
            {method.type === 'card' 
              ? `**** **** **** ${method.lastFour}`
              : method.name
            }
          </Text>
          <Text style={styles.methodSubtitle}>
            {method.type === 'card' 
              ? `${method.brand} • Vence ${method.expiryMonth}/${method.expiryYear}`
              : 'Transferencia bancaria'
            }
          </Text>
        </View>
      </View>
      
      {selectedMethod?.id === method.id && (
        <View style={styles.selectedIndicator}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (paymentProcessing) {
    return (
      <View style={styles.container}>
        <NavHeader
          title="Procesando Pago"
          onBack={() => {}} // Deshabilitar botón durante procesamiento
        />
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
          <Text style={styles.processingTitle}>Procesando tu pago...</Text>
          <Text style={styles.processingSubtitle}>Por favor no cierres la aplicación</Text>
          
          {paymentResult && (
            <View style={[
              styles.resultContainer,
              paymentResult.success ? styles.successResult : styles.errorResult
            ]}>
              <Text style={styles.resultIcon}>
                {paymentResult.success ? '✅' : paymentResult.pending ? '⏳' : '❌'}
              </Text>
              <Text style={styles.resultMessage}>{paymentResult.message}</Text>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavHeader
        title="Realizar Pago"
        onBack={() => navigation.goBack()}
      />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Resumen del pago */}
        <Card style={styles.summaryCard}>
          <Text style={styles.sectionTitle}>📋 Resumen del Pago</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Servicio:</Text>
            <Text style={styles.summaryValue}>Servicio de Limpieza</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Proveedor:</Text>
            <Text style={styles.summaryValue}>{providerName}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal:</Text>
            <Text style={styles.summaryValue}>${amount?.toLocaleString()}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Comisión plataforma:</Text>
            <Text style={styles.summaryValue}>$0</Text>
          </View>
          
          <View style={[styles.summaryRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total a pagar:</Text>
            <Text style={styles.totalValue}>${amount?.toLocaleString()}</Text>
          </View>
        </Card>

        {/* Métodos de pago */}
        <Card style={styles.methodsCard}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>💳 Métodos de Pago</Text>
            <Button
              title="Agregar"
              variant="outline"
              size="small"
              onPress={handleAddCard}
            />
          </View>

          {loading ? (
            <ActivityIndicator size="small" color={COLORS.PRIMARY} />
          ) : (
            <View style={styles.methodsList}>
              {paymentMethods.map(renderPaymentMethod)}
              
              {paymentMethods.length === 0 && (
                <View style={styles.emptyMethods}>
                  <Text style={styles.emptyIcon}>💳</Text>
                  <Text style={styles.emptyTitle}>Sin métodos de pago</Text>
                  <Text style={styles.emptySubtitle}>
                    Agrega una tarjeta para continuar con el pago
                  </Text>
                </View>
              )}
            </View>
          )}
        </Card>

        {/* Información de seguridad */}
        <Card style={styles.securityCard}>
          <Text style={styles.sectionTitle}>🔒 Pago Seguro</Text>
          <Text style={styles.securityText}>
            Tus datos están protegidos con encriptación SSL de 256 bits. 
            Utilizamos Wompi como procesador de pagos certificado PCI DSS.
          </Text>
        </Card>

        {/* Botón de pago */}
        <View style={styles.paymentButtonContainer}>
          <Button
            title={`Pagar $${amount?.toLocaleString()}`}
            variant="primary"
            fullWidth
            onPress={handlePayment}
            disabled={!selectedMethod || loading}
            style={styles.paymentButton}
          />
        </View>
      </ScrollView>

      {/* Modal para agregar tarjeta */}
      <Modal
        visible={cardModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <NavHeader
            title="Agregar Tarjeta"
            onBack={() => setCardModalVisible(false)}
          />
          
          <ScrollView style={styles.modalContent}>
            <Card style={styles.cardForm}>
              <Text style={styles.formTitle}>💳 Datos de la Tarjeta</Text>
              
              <Input
                label="Número de tarjeta"
                placeholder="1234 5678 9012 3456"
                value={cardForm.number}
                onChangeText={(text) => setCardForm({
                  ...cardForm,
                  number: formatCardNumber(text)
                })}
                keyboardType="numeric"
                maxLength={19}
              />
              
              <View style={styles.cardRowInputs}>
                <Input
                  label="Vencimiento"
                  placeholder="MM/YY"
                  value={cardForm.expiry}
                  onChangeText={(text) => setCardForm({
                    ...cardForm,
                    expiry: formatExpiry(text)
                  })}
                  keyboardType="numeric"
                  maxLength={5}
                  style={styles.halfInput}
                />
                
                <Input
                  label="CVC"
                  placeholder="123"
                  value={cardForm.cvc}
                  onChangeText={(text) => setCardForm({
                    ...cardForm,
                    cvc: text.replace(/\D/g, '').substring(0, 4)
                  })}
                  keyboardType="numeric"
                  maxLength={4}
                  style={styles.halfInput}
                />
              </View>
              
              <Input
                label="Nombre del titular"
                placeholder="Como aparece en la tarjeta"
                value={cardForm.holderName}
                onChangeText={(text) => setCardForm({
                  ...cardForm,
                  holderName: text
                })}
                autoCapitalize="words"
              />
            </Card>
            
            <View style={styles.modalButtons}>
              <Button
                title="Cancelar"
                variant="outline"
                onPress={() => setCardModalVisible(false)}
                style={styles.modalButton}
              />
              <Button
                title="Guardar Tarjeta"
                variant="primary"
                onPress={handleSaveCard}
                style={styles.modalButton}
                loading={loading}
              />
            </View>
          </ScrollView>
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

  summaryCard: {
    marginTop: SPACING.MD,
    marginBottom: SPACING.MD,
  },

  sectionTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.DARK,
    marginBottom: SPACING.MD,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
  },

  summaryLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
  },

  summaryValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    fontWeight: '500',
  },

  totalRow: {
    borderTopWidth: 1,
    borderTopColor: COLORS.GRAY_LIGHT,
    marginTop: SPACING.SM,
    paddingTop: SPACING.MD,
  },

  totalLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
  },

  totalValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.PRIMARY,
  },

  methodsCard: {
    marginBottom: SPACING.MD,
  },

  methodsList: {
    gap: SPACING.SM,
  },

  paymentMethodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: COLORS.WHITE,
  },

  selectedPaymentMethod: {
    borderColor: COLORS.PRIMARY,
    backgroundColor: `${COLORS.PRIMARY}08`,
  },

  methodHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  methodIcon: {
    fontSize: 24,
    marginRight: SPACING.MD,
  },

  methodInfo: {
    flex: 1,
  },

  methodTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },

  methodSubtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
  },

  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
  },

  checkmark: {
    color: COLORS.WHITE,
    fontSize: 16,
    fontWeight: 'bold',
  },

  emptyMethods: {
    alignItems: 'center',
    paddingVertical: SPACING.XXL,
  },

  emptyIcon: {
    fontSize: 48,
    marginBottom: SPACING.MD,
  },

  emptyTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.SM,
  },

  emptySubtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
  },

  securityCard: {
    marginBottom: SPACING.MD,
  },

  securityText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    lineHeight: 20,
  },

  paymentButtonContainer: {
    paddingVertical: SPACING.LG,
  },

  paymentButton: {
    height: 56,
  },

  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.LG,
  },

  processingTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '600',
    color: COLORS.DARK,
    marginTop: SPACING.LG,
    marginBottom: SPACING.SM,
  },

  processingSubtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
  },

  resultContainer: {
    marginTop: SPACING.XXL,
    padding: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
  },

  successResult: {
    backgroundColor: `${COLORS.SUCCESS}20`,
  },

  errorResult: {
    backgroundColor: `${COLORS.ERROR}20`,
  },

  resultIcon: {
    fontSize: 48,
    marginBottom: SPACING.MD,
  },

  resultMessage: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    textAlign: 'center',
    color: COLORS.DARK,
  },

  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.GRAY_LIGHT,
  },

  modalContent: {
    flex: 1,
    paddingHorizontal: SPACING.MD,
  },

  cardForm: {
    marginTop: SPACING.MD,
    marginBottom: SPACING.MD,
  },

  formTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '700',
    color: COLORS.DARK,
    marginBottom: SPACING.LG,
  },

  cardRowInputs: {
    flexDirection: 'row',
    gap: SPACING.MD,
  },

  halfInput: {
    flex: 1,
  },

  modalButtons: {
    flexDirection: 'row',
    gap: SPACING.MD,
    paddingBottom: SPACING.XL,
  },

  modalButton: {
    flex: 1,
  },
});

export default PaymentScreen;