import React from 'react';
import {
  Modal,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

export default function LegalModal({ visible, onClose, type = 'terms' }) {
  const isTerms = type === 'terms';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>
              {isTerms ? 'Términos y Condiciones (Colombia)' : 'Política de Tratamiento de Datos (Habeas Data)'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Cerrar">
              <Ionicons name="close" size={24} color={COLORS.TEXT_PRIMARY || '#FFFFFF'} />
            </TouchableOpacity>
          </View>

          {/* Body */}
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {isTerms ? (
              <View style={styles.content}>
                <Text style={styles.updated}>Vigencia: Septiembre 2026 · República de Colombia</Text>
                
                <Text style={styles.sectionTitle}>1. Intermediación Tecnológica (Ley 1480 de 2011)</Text>
                <Text style={styles.paragraph}>
                  Homecare Colorimetría opera exclusivamente como un portal de contacto e intermediario tecnológico conforme al artículo 53 del Estatuto del Consumidor de Colombia (Ley 1480 de 2011). La plataforma no es peluquería, no es empleadora ni presta directamente los servicios de belleza, estética o colorimetría.
                </Text>

                <Text style={styles.sectionTitle}>2. Independencia del Profesional</Text>
                <Text style={styles.paragraph}>
                  Los profesionales registrados son trabajadores independientes autónomos que prestan sus servicios bajo su propia cuenta, riesgo y herramientas. No existe relación de subordinación ni vínculo laboral con Homecare.
                </Text>

                <Text style={styles.sectionTitle}>3. Exoneración por Hurtos, Delitos y Extravíos</Text>
                <Text style={styles.paragraph}>
                  Homecare NO asume responsabilidad alguna, ni civil ni penal, por la ocurrencia de delitos, hurtos, pérdidas o extravíos de dinero, joyas, dispositivos o cualquier bien dentro o fuera del domicilio del usuario. El usuario cliente asume el deber expreso de custodia y vigilancia permanente de sus pertenencias de valor durante la ejecución del servicio.
                </Text>

                <Text style={styles.sectionTitle}>4. Daños Materiales y Reacciones Químicas</Text>
                <Text style={styles.paragraph}>
                  Cualquier daño material en el inmueble, mobiliario o prendas, así como resultados capilares insatisfactorios, decoloraciones o reacciones alérgicas derivadas de químicos aplicados, son de exclusiva responsabilidad del profesional independiente contratado. Homecare no responde por daños directos ni indirectos derivados de la ejecución técnica.
                </Text>

                <Text style={styles.sectionTitle}>5. Cooperación con Autoridades Judiciales</Text>
                <Text style={styles.paragraph}>
                  Ante cualquier denuncia o incidente, Homecare cooperará con la Fiscalía General de la Nación y la Policía Nacional de Colombia suministrando los registros de geolocalización, trazabilidad, identidad y chats previa solicitud formal de autoridad competente.
                </Text>

                <Text style={styles.sectionTitle}>6. Pagos y Cancelaciones</Text>
                <Text style={styles.paragraph}>
                  Las tarifas son acordadas bajo oferta y contraoferta libre. Los pagos se procesan de forma segura a través de pasarelas autorizadas (Mercado Pago).
                </Text>
              </View>
            ) : (
              <View style={styles.content}>
                <Text style={styles.updated}>Ley 1581 de 2012 y Decreto 1377 de 2013 · Colombia</Text>

                <Text style={styles.sectionTitle}>1. Responsable del Tratamiento</Text>
                <Text style={styles.paragraph}>
                  Homecare Colorimetría, en cumplimiento del régimen de protección de datos personales de Colombia, es el responsable del tratamiento de los datos personales suministrados por usuarios y profesionales.
                </Text>

                <Text style={styles.sectionTitle}>2. Finalidades Autorizadas</Text>
                <Text style={styles.paragraph}>
                  Sus datos (nombre, teléfono, correo, geolocalización y fotos de evidencia) se tratan para: (i) Conectar y coordinar citas a domicilio; (ii) Trazabilidad en mapa en tiempo real por seguridad mutua; (iii) Validación de identidad; y (iv) Notificaciones del servicio.
                </Text>

                <Text style={styles.sectionTitle}>3. Geolocalización en Tiempo Real</Text>
                <Text style={styles.paragraph}>
                  La captura de ubicación por GPS se realiza únicamente durante el transcurso del servicio activo para el cálculo de tiempos y monitoreo de ruta, garantizando la seguridad en el desplazamiento.
                </Text>

                <Text style={styles.sectionTitle}>4. Derechos del Titular (Habeas Data)</Text>
                <Text style={styles.paragraph}>
                  Conforme a la Ley 1581 de 2012, usted tiene derecho a conocer, actualizar, rectificar y suprimir sus datos en cualquier momento.
                </Text>

                <Text style={styles.sectionTitle}>5. Eliminación Inmediata de Cuenta</Text>
                <Text style={styles.paragraph}>
                  Usted puede ejercer su derecho de supresión y anonimización de cuenta en cualquier momento directamente desde la opción "Eliminar mi cuenta" en su perfil de la aplicación.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Footer */}
          <TouchableOpacity style={styles.acceptButton} onPress={onClose}>
            <Text style={styles.acceptButtonText}>Aceptar y Continuar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 15, 34, 0.85)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#001B38',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    padding: SPACING.lg || 20,
    borderWidth: 1,
    borderColor: 'rgba(73, 192, 188, 0.2)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    flex: 1,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    marginBottom: 16,
  },
  content: {
    paddingBottom: 12,
  },
  updated: {
    fontSize: 12,
    color: 'rgba(73, 192, 188, 0.9)',
    marginBottom: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#49C0BC',
    marginTop: 12,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 14,
    lineHeight: 21,
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 8,
  },
  acceptButton: {
    backgroundColor: '#49C0BC',
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.md || 12,
    alignItems: 'center',
  },
  acceptButtonText: {
    color: '#001B38',
    fontSize: 16,
    fontWeight: '700',
  },
});
