import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
  Modal
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../theme';
import { settingsService } from '../../services/settingsService';

const SettingsScreen = () => {
  const [settings, setSettings] = useState({
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
    security: {
      twoFactorAuth: false,
      sessionTimeout: 30,
    },
    app: {
      theme: 'light',
      language: 'es',
      autoBackup: true,
    },
    business: {
      commissionRate: 15,
      minServiceFee: 10,
      maxServiceRadius: 50,
    }
  });

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState('');
  const [modalValue, setModalValue] = useState('');

  const updateSetting = (section, key, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [key]: value
      }
    }));
  };

  const saveSettings = async () => {
    try {
      await settingsService.updateSettings(settings);
      Alert.alert('Éxito', 'Configuración guardada correctamente');
    } catch (error) {
      Alert.alert('Error', 'No se pudo guardar la configuración');
    }
  };

  const resetSettings = () => {
    Alert.alert(
      'Restaurar Configuración',
      '¿Estás seguro de que quieres restaurar la configuración por defecto?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Restaurar', 
          onPress: async () => {
            try {
              await settingsService.resetSettings();
              Alert.alert('Éxito', 'Configuración restaurada');
            } catch (error) {
              Alert.alert('Error', 'No se pudo restaurar la configuración');
            }
          }
        }
      ]
    );
  };

  const openModal = (type, currentValue) => {
    setModalType(type);
    setModalValue(currentValue.toString());
    setModalVisible(true);
  };

  const saveModalValue = () => {
    const numValue = parseFloat(modalValue);
    switch (modalType) {
      case 'sessionTimeout':
        updateSetting('security', 'sessionTimeout', numValue);
        break;
      case 'commissionRate':
        updateSetting('business', 'commissionRate', numValue);
        break;
      case 'minServiceFee':
        updateSetting('business', 'minServiceFee', numValue);
        break;
      case 'maxServiceRadius':
        updateSetting('business', 'maxServiceRadius', numValue);
        break;
    }
    setModalVisible(false);
  };

  const SettingSection = ({ title, children }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );

  const SettingRow = ({ label, value, onPress, type = 'switch' }) => (
    <View style={styles.settingRow}>
      <Text style={styles.settingLabel}>{label}</Text>
      {type === 'switch' ? (
        <Switch
          value={value}
          onValueChange={onPress}
          trackColor={{ false: COLORS.GRAY_LIGHT, true: COLORS.PRIMARY }}
          thumbColor={COLORS.WHITE}
        />
      ) : type === 'text' ? (
        <TouchableOpacity onPress={onPress} style={styles.settingValueContainer}>
          <Text style={styles.settingValue}>{value}</Text>
          <Text style={styles.settingArrow}>›</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );

  const ValueModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setModalVisible(false)}>
            <Text style={styles.modalCancel}>Cancelar</Text>
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Editar Valor</Text>
          <TouchableOpacity onPress={saveModalValue}>
            <Text style={styles.modalSave}>Guardar</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.modalContent}>
          <TextInput
            style={styles.modalInput}
            value={modalValue}
            onChangeText={setModalValue}
            keyboardType="numeric"
            placeholder="Ingresa el valor"
          />
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Configuración del Sistema</Text>
      </View>

      {/* Notificaciones */}
      <SettingSection title="Notificaciones">
        <SettingRow
          label="Notificaciones por email"
          value={settings.notifications.email}
          onPress={(value) => updateSetting('notifications', 'email', value)}
        />
        <SettingRow
          label="Notificaciones push"
          value={settings.notifications.push}
          onPress={(value) => updateSetting('notifications', 'push', value)}
        />
        <SettingRow
          label="Notificaciones SMS"
          value={settings.notifications.sms}
          onPress={(value) => updateSetting('notifications', 'sms', value)}
        />
      </SettingSection>

      {/* Seguridad */}
      <SettingSection title="Seguridad">
        <SettingRow
          label="Autenticación de dos factores"
          value={settings.security.twoFactorAuth}
          onPress={(value) => updateSetting('security', 'twoFactorAuth', value)}
        />
        <SettingRow
          label="Tiempo de sesión (minutos)"
          value={`${settings.security.sessionTimeout} min`}
          onPress={() => openModal('sessionTimeout', settings.security.sessionTimeout)}
          type="text"
        />
      </SettingSection>

      {/* Aplicación */}
      <SettingSection title="Aplicación">
        <SettingRow
          label="Tema oscuro"
          value={settings.app.theme === 'dark'}
          onPress={(value) => updateSetting('app', 'theme', value ? 'dark' : 'light')}
        />
        <SettingRow
          label="Copia de seguridad automática"
          value={settings.app.autoBackup}
          onPress={(value) => updateSetting('app', 'autoBackup', value)}
        />
        <SettingRow
          label="Idioma"
          value="Español"
          onPress={() => Alert.alert('Próximamente', 'Selección de idioma disponible pronto')}
          type="text"
        />
      </SettingSection>

      {/* Configuración de Negocio */}
      <SettingSection title="Configuración de Negocio">
        <SettingRow
          label="Comisión de la plataforma (%)"
          value={`${settings.business.commissionRate}%`}
          onPress={() => openModal('commissionRate', settings.business.commissionRate)}
          type="text"
        />
        <SettingRow
          label="Tarifa mínima de servicio ($)"
          value={`$${settings.business.minServiceFee}`}
          onPress={() => openModal('minServiceFee', settings.business.minServiceFee)}
          type="text"
        />
        <SettingRow
          label="Radio máximo de servicio (km)"
          value={`${settings.business.maxServiceRadius} km`}
          onPress={() => openModal('maxServiceRadius', settings.business.maxServiceRadius)}
          type="text"
        />
      </SettingSection>

      {/* Mantenimiento */}
      <SettingSection title="Mantenimiento">
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Próximamente', 'Limpieza de caché disponible pronto')}>
          <Text style={styles.actionButtonText}>🗑️ Limpiar Caché</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Próximamente', 'Exportación de datos disponible pronto')}>
          <Text style={styles.actionButtonText}>📤 Exportar Datos</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={() => Alert.alert('Próximamente', 'Copia de seguridad disponible pronto')}>
          <Text style={styles.actionButtonText}>💾 Crear Respaldo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.dangerButton]} onPress={resetSettings}>
          <Text style={[styles.actionButtonText, styles.dangerText]}>🔄 Restaurar Configuración</Text>
        </TouchableOpacity>
      </SettingSection>

      {/* Información del Sistema */}
      <SettingSection title="Información del Sistema">
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Versión de la app:</Text>
          <Text style={styles.infoValue}>1.0.0</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Última actualización:</Text>
          <Text style={styles.infoValue}>15 Ene 2026</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Base de datos:</Text>
          <Text style={styles.infoValue}>PostgreSQL 13.2</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.infoLabel}>Servidor:</Text>
          <Text style={styles.infoValue}>Ubuntu 20.04 LTS</Text>
        </View>
      </SettingSection>

      {/* Botón Guardar */}
      <TouchableOpacity style={styles.saveButton} onPress={saveSettings}>
        <Text style={styles.saveButtonText}>Guardar Configuración</Text>
      </TouchableOpacity>

      <ValueModal />
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
  header: {
    backgroundColor: COLORS.WHITE,
    padding: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  title: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  section: {
    backgroundColor: COLORS.WHITE,
    margin: SPACING.MD,
    borderRadius: 12,
    padding: SPACING.LG,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: SPACING.LG,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  settingLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.DARK,
    flex: 1,
  },
  settingValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.GRAY_DARK,
    marginRight: SPACING.SM,
  },
  settingArrow: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    color: COLORS.GRAY_DARK,
  },
  actionButton: {
    backgroundColor: COLORS.LIGHT_GRAY,
    padding: SPACING.MD,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.MD,
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.DARK,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: COLORS.ERROR_LIGHT || '#ffe6e6',
    borderColor: COLORS.ERROR,
  },
  dangerText: {
    color: COLORS.ERROR,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.SM,
  },
  infoLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
  },
  infoValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.DARK,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    margin: SPACING.MD,
    padding: SPACING.LG,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: 'bold',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.WHITE,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  modalCancel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.GRAY_DARK,
  },
  modalSave: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.PRIMARY,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: SPACING.LG,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 8,
    padding: SPACING.MD,
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
  },
});

export default SettingsScreen;