import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  Image,
  ActivityIndicator
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../theme';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';

const ClientProfileScreen = ({ navigation }) => {
  const { user, updateUser, logout } = useAuth();
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    emergencyContact: user?.emergencyContact || '',
  });

  const handleInputChange = (field, value) => {
    setProfileData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updatedUser = await userService.updateProfile(profileData);
      await updateUser(updatedUser);
      setEditMode(false);
      Alert.alert('Éxito', 'Perfil actualizado correctamente');
    } catch (error) {
      Alert.alert('Error', error.message || 'Error al actualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setProfileData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      address: user?.address || '',
      emergencyContact: user?.emergencyContact || '',
    });
    setEditMode(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Cerrar Sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Cerrar Sesión', onPress: logout, style: 'destructive' }
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar Cuenta',
      'Esta acción no se puede deshacer. ¿Estás seguro?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Eliminar', 
          onPress: async () => {
            try {
              await userService.deleteAccount();
              await logout();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar la cuenta');
            }
          },
          style: 'destructive' 
        }
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: user?.avatar || 'https://via.placeholder.com/100' }}
            style={styles.avatar}
          />
          <TouchableOpacity style={styles.editAvatarButton}>
            <Text style={styles.editAvatarText}>📷</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userRole}>Cliente</Text>
      </View>

      {/* Profile Form */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => editMode ? handleCancel() : setEditMode(true)}
          >
            <Text style={styles.editButtonText}>
              {editMode ? 'Cancelar' : 'Editar'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre completo</Text>
          <TextInput
            style={[styles.input, !editMode && styles.inputDisabled]}
            value={profileData.name}
            onChangeText={(text) => handleInputChange('name', text)}
            editable={editMode}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={[styles.input, styles.inputDisabled]}
            value={profileData.email}
            editable={false}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Teléfono</Text>
          <TextInput
            style={[styles.input, !editMode && styles.inputDisabled]}
            value={profileData.phone}
            onChangeText={(text) => handleInputChange('phone', text)}
            editable={editMode}
            keyboardType="phone-pad"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Dirección</Text>
          <TextInput
            style={[styles.input, !editMode && styles.inputDisabled]}
            value={profileData.address}
            onChangeText={(text) => handleInputChange('address', text)}
            editable={editMode}
            multiline
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Contacto de emergencia</Text>
          <TextInput
            style={[styles.input, !editMode && styles.inputDisabled]}
            value={profileData.emergencyContact}
            onChangeText={(text) => handleInputChange('emergencyContact', text)}
            editable={editMode}
            keyboardType="phone-pad"
          />
        </View>

        {editMode && (
          <TouchableOpacity
            style={[styles.saveButton, loading && styles.disabledButton]}
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={COLORS.WHITE} />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Cambios</Text>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Statistics Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Estadísticas</Text>
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Servicios</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>4.8</Text>
            <Text style={styles.statLabel}>Calificación</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Este mes</Text>
          </View>
        </View>
      </View>

      {/* Options Section */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.optionItem} onPress={() => navigation.navigate('ServiceHistory')}>
          <Text style={styles.optionText}>📋 Historial de Servicios</Text>
          <Text style={styles.optionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem} onPress={() => navigation.navigate('Payment')}>
          <Text style={styles.optionText}>💳 Métodos de Pago</Text>
          <Text style={styles.optionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem}>
          <Text style={styles.optionText}>🔔 Notificaciones</Text>
          <Text style={styles.optionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem}>
          <Text style={styles.optionText}>❓ Ayuda y Soporte</Text>
          <Text style={styles.optionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem}>
          <Text style={styles.optionText}>📄 Términos y Condiciones</Text>
          <Text style={styles.optionArrow}>→</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.optionItem}>
          <Text style={styles.optionText}>🔒 Política de Privacidad</Text>
          <Text style={styles.optionArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Logout and Delete Account */}
      <View style={styles.section}>
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteButtonText}>Eliminar Cuenta</Text>
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
  header: {
    backgroundColor: COLORS.WHITE,
    alignItems: 'center',
    padding: SPACING.LG,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.MD,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.GRAY_LIGHT,
  },
  editAvatarButton: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.PRIMARY,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editAvatarText: {
    fontSize: 16,
  },
  userName: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  userRole: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  section: {
    backgroundColor: COLORS.WHITE,
    margin: SPACING.MD,
    padding: SPACING.LG,
    borderRadius: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.LG,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  editButton: {
    backgroundColor: COLORS.PRIMARY,
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    borderRadius: 6,
  },
  editButtonText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: SPACING.MD,
  },
  label: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: '600',
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 8,
    padding: SPACING.MD,
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    backgroundColor: COLORS.WHITE,
  },
  inputDisabled: {
    backgroundColor: COLORS.LIGHT_GRAY,
    color: COLORS.GRAY_DARK,
  },
  saveButton: {
    backgroundColor: COLORS.PRIMARY,
    padding: SPACING.MD,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: SPACING.MD,
  },
  disabledButton: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: SPACING.MD,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: 'bold',
    color: COLORS.PRIMARY,
  },
  statLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    marginTop: SPACING.XS,
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  optionText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.DARK,
  },
  optionArrow: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    color: COLORS.GRAY_DARK,
  },
  logoutButton: {
    backgroundColor: COLORS.SECONDARY,
    padding: SPACING.MD,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  logoutButtonText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: 'bold',
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR,
    padding: SPACING.MD,
    borderRadius: 8,
    alignItems: 'center',
  },
  deleteButtonText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: 'bold',
  },
});

export default ClientProfileScreen;