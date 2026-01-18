import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, StatusBar } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, DIMENSIONS } from '../theme';

/**
 * HEADER HOMECARE
 * Componente de encabezado consistente para toda la aplicación
 * Características:
 * - SafeArea automático
 * - StatusBar configurado
 * - Botones de navegación opcionales
 * - Título centrado o personalizado
 */
export const Header = ({
  title,
  subtitle,
  leftComponent,
  rightComponent,
  backgroundColor = COLORS.WHITE,
  titleColor = COLORS.DARK,
  style,
  ...props
}) => {
  return (
    <>
      <StatusBar
        barStyle="dark-content"
        backgroundColor={backgroundColor}
        translucent={false}
      />
      <SafeAreaView style={[styles.safeArea, { backgroundColor }]}>
        <View style={[styles.header, { backgroundColor }, style]} {...props}>
          {/* Componente izquierdo (botón atrás, menú, etc.) */}
          <View style={styles.leftSection}>
            {leftComponent}
          </View>

          {/* Título central */}
          <View style={styles.centerSection}>
            {title && (
              <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={[styles.subtitle, { color: titleColor }]} numberOfLines={1}>
                {subtitle}
              </Text>
            )}
          </View>

          {/* Componente derecho (acciones, perfil, etc.) */}
          <View style={styles.rightSection}>
            {rightComponent}
          </View>
        </View>
      </SafeAreaView>
    </>
  );
};

/**
 * HEADER ESPECIALIZADO: PANTALLA PRINCIPAL
 */
export const MainHeader = ({
  userName,
  userAvatar,
  notifications = 0,
  onProfilePress,
  onNotificationsPress,
  onLocationPress,
  currentLocation,
  style,
}) => {
  return (
    <Header
      backgroundColor={COLORS.PRIMARY}
      titleColor={COLORS.WHITE}
      leftComponent={
        <TouchableOpacity style={styles.profileButton} onPress={onProfilePress}>
          <View style={styles.avatarContainer}>
            {/* Avatar placeholder */}
            <View style={styles.avatarMain}>
              <Text style={styles.avatarMainText}>
                {userName ? userName.charAt(0).toUpperCase() : 'U'}
              </Text>
            </View>
          </View>
          <View style={styles.welcomeContainer}>
            <Text style={styles.welcomeText}>¡Hola!</Text>
            <Text style={styles.userNameText}>{userName || 'Usuario'}</Text>
          </View>
        </TouchableOpacity>
      }
      rightComponent={
        <View style={styles.rightActions}>
          <TouchableOpacity style={styles.locationButton} onPress={onLocationPress}>
            <Text style={styles.locationIcon}>📍</Text>
            <Text style={styles.locationText} numberOfLines={1}>
              {currentLocation || 'Ubicación'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.notificationButton} onPress={onNotificationsPress}>
            <Text style={styles.notificationIcon}>🔔</Text>
            {notifications > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {notifications > 99 ? '99+' : notifications}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      }
      style={style}
    />
  );
};

/**
 * HEADER ESPECIALIZADO: NAVEGACIÓN CON BOTÓN ATRÁS
 */
export const NavHeader = ({
  title,
  onBack,
  actions,
  style,
}) => {
  return (
    <Header
      title={title}
      leftComponent={
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
      }
      rightComponent={actions && (
        <View style={styles.actionsContainer}>
          {actions}
        </View>
      )}
      style={style}
    />
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: COLORS.WHITE,
  },
  
  header: {
    height: DIMENSIONS.HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.MD,
    backgroundColor: COLORS.WHITE,
  },
  
  leftSection: {
    flex: 1,
    alignItems: 'flex-start',
  },
  
  centerSection: {
    flex: 2,
    alignItems: 'center',
  },
  
  rightSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  
  title: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XL,
    fontWeight: '600',
    color: COLORS.DARK,
    textAlign: 'center',
  },
  
  subtitle: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.GRAY_DARK,
    textAlign: 'center',
    marginTop: 2,
  },
  
  // MainHeader específico
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  avatarContainer: {
    marginRight: SPACING.SM,
  },
  
  avatarMain: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.WHITE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  avatarMainText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.PRIMARY,
    fontWeight: '600',
  },
  
  welcomeContainer: {
    alignItems: 'flex-start',
  },
  
  welcomeText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.WHITE,
    opacity: 0.9,
  },
  
  userNameText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.MD,
    maxWidth: 100,
  },
  
  locationIcon: {
    fontSize: 16,
    marginRight: SPACING.XS,
  },
  
  locationText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.XS,
    color: COLORS.WHITE,
  },
  
  notificationButton: {
    position: 'relative',
    padding: SPACING.XS,
  },
  
  notificationIcon: {
    fontSize: 20,
  },
  
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.ERROR,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  
  notificationBadgeText: {
    fontSize: 10,
    color: COLORS.WHITE,
    fontWeight: '600',
  },
  
  // NavHeader específico
  backButton: {
    padding: SPACING.SM,
  },
  
  backIcon: {
    fontSize: 24,
    color: COLORS.DARK,
  },
  
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

export { Header as default };