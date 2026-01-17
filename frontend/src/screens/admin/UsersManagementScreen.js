import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING } from '../../theme';
import { userService } from '../../services/userService';

const UsersManagementScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const usersData = await userService.getAllUsers();
      setUsers(usersData);
    } catch (error) {
      Alert.alert('Error', 'No se pudieron cargar los usuarios');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserAction = (user, action) => {
    setSelectedUser(user);
    Alert.alert(
      `${action} Usuario`,
      `¿Estás seguro de ${action.toLowerCase()} a ${user.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: action,
          onPress: () => executeUserAction(user.id, action),
          style: action === 'Eliminar' ? 'destructive' : 'default'
        }
      ]
    );
  };

  const executeUserAction = async (userId, action) => {
    setActionLoading(true);
    try {
      switch (action) {
        case 'Suspender':
          await userService.suspendUser(userId);
          break;
        case 'Activar':
          await userService.activateUser(userId);
          break;
        case 'Eliminar':
          await userService.deleteUser(userId);
          break;
      }
      await loadUsers();
      Alert.alert('Éxito', `Usuario ${action.toLowerCase()}do correctamente`);
    } catch (error) {
      Alert.alert('Error', `No se pudo ${action.toLowerCase()} el usuario`);
    } finally {
      setActionLoading(false);
    }
  };

  const renderUserItem = ({ item: user }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => {
        setSelectedUser(user);
        setModalVisible(true);
      }}
    >
      <View style={styles.userInfo}>
        <View style={styles.userHeader}>
          <Text style={styles.userName}>{user.name}</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: user.active ? COLORS.SUCCESS : COLORS.ERROR }
          ]}>
            <Text style={styles.statusText}>
              {user.active ? 'Activo' : 'Suspendido'}
            </Text>
          </View>
        </View>
        <Text style={styles.userEmail}>{user.email}</Text>
        <View style={styles.userDetails}>
          <Text style={styles.userRole}>{user.role === 'customer' ? '👤 Cliente' : '🔧 Proveedor'}</Text>
          <Text style={styles.userDate}>Registro: {new Date(user.createdAt).toLocaleDateString()}</Text>
        </View>
      </View>
      <Text style={styles.chevron}>→</Text>
    </TouchableOpacity>
  );

  const UserDetailModal = () => (
    <Modal
      visible={modalVisible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Detalles del Usuario</Text>
          <TouchableOpacity
            onPress={() => setModalVisible(false)}
            style={styles.closeButton}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
        </View>

        {selectedUser && (
          <View style={styles.modalContent}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Nombre:</Text>
              <Text style={styles.detailValue}>{selectedUser.name}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Email:</Text>
              <Text style={styles.detailValue}>{selectedUser.email}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Teléfono:</Text>
              <Text style={styles.detailValue}>{selectedUser.phone || 'No registrado'}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Rol:</Text>
              <Text style={styles.detailValue}>
                {selectedUser.role === 'customer' ? 'Cliente' : 'Proveedor'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Estado:</Text>
              <Text style={[
                styles.detailValue,
                { color: selectedUser.active ? COLORS.SUCCESS : COLORS.ERROR }
              ]}>
                {selectedUser.active ? 'Activo' : 'Suspendido'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Fecha de registro:</Text>
              <Text style={styles.detailValue}>
                {new Date(selectedUser.createdAt).toLocaleDateString()}
              </Text>
            </View>

            <View style={styles.actionButtons}>
              {selectedUser.active ? (
                <TouchableOpacity
                  style={[styles.actionButton, styles.suspendButton]}
                  onPress={() => {
                    setModalVisible(false);
                    handleUserAction(selectedUser, 'Suspender');
                  }}
                  disabled={actionLoading}
                >
                  <Text style={styles.actionButtonText}>Suspender Usuario</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.actionButton, styles.activateButton]}
                  onPress={() => {
                    setModalVisible(false);
                    handleUserAction(selectedUser, 'Activar');
                  }}
                  disabled={actionLoading}
                >
                  <Text style={styles.actionButtonText}>Activar Usuario</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.actionButton, styles.deleteButton]}
                onPress={() => {
                  setModalVisible(false);
                  handleUserAction(selectedUser, 'Eliminar');
                }}
                disabled={actionLoading}
              >
                <Text style={styles.actionButtonText}>Eliminar Usuario</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={styles.loadingText}>Cargando usuarios...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestión de Usuarios</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuarios..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{users.length}</Text>
          <Text style={styles.statLabel}>Total Usuarios</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {users.filter(u => u.role === 'customer').length}
          </Text>
          <Text style={styles.statLabel}>Clientes</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {users.filter(u => u.role === 'provider').length}
          </Text>
          <Text style={styles.statLabel}>Proveedores</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>
            {users.filter(u => u.active).length}
          </Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
      </View>

      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.usersList}
        refreshing={loading}
        onRefresh={loadUsers}
      />

      <UserDetailModal />

      {actionLoading && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.LIGHT_GRAY,
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
    backgroundColor: COLORS.WHITE,
    padding: SPACING.LG,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },
  title: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: SPACING.MD,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: COLORS.GRAY_LIGHT,
    borderRadius: 8,
    padding: SPACING.MD,
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: COLORS.WHITE,
    margin: SPACING.MD,
    borderRadius: 12,
    overflow: 'hidden',
  },
  statItem: {
    flex: 1,
    padding: SPACING.MD,
    alignItems: 'center',
    borderRightWidth: 1,
    borderRightColor: COLORS.GRAY_LIGHT,
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
    textAlign: 'center',
  },
  usersList: {
    flex: 1,
    paddingHorizontal: SPACING.MD,
  },
  userItem: {
    backgroundColor: COLORS.WHITE,
    borderRadius: 12,
    padding: SPACING.LG,
    marginBottom: SPACING.MD,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.SM,
  },
  userName: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  statusBadge: {
    paddingHorizontal: SPACING.SM,
    paddingVertical: SPACING.XS,
    borderRadius: 12,
  },
  statusText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.WHITE,
    fontWeight: 'bold',
  },
  userEmail: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.GRAY_DARK,
    marginBottom: SPACING.SM,
  },
  userDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  userRole: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  userDate: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
  },
  chevron: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    color: COLORS.GRAY_DARK,
    marginLeft: SPACING.MD,
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
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: 'bold',
    color: COLORS.DARK,
  },
  closeButton: {
    padding: SPACING.SM,
  },
  closeButtonText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    color: COLORS.GRAY_DARK,
  },
  modalContent: {
    padding: SPACING.LG,
  },
  detailItem: {
    marginBottom: SPACING.LG,
  },
  detailLabel: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    fontWeight: 'bold',
    color: COLORS.DARK,
    marginBottom: SPACING.XS,
  },
  detailValue: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.GRAY_DARK,
  },
  actionButtons: {
    marginTop: SPACING.XL,
  },
  actionButton: {
    padding: SPACING.MD,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: SPACING.MD,
  },
  suspendButton: {
    backgroundColor: COLORS.WARNING,
  },
  activateButton: {
    backgroundColor: COLORS.SUCCESS,
  },
  deleteButton: {
    backgroundColor: COLORS.ERROR,
  },
  actionButtonText: {
    color: COLORS.WHITE,
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: 'bold',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default UsersManagementScreen;