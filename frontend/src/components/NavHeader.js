import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, DIMENSIONS } from '../theme';

/**
 * NAVHEADER COMPONENT
 * Componente de navegación con botón de retroceso
 */
export const NavHeader = ({
  title,
  onBack,
  rightComponent,
  backgroundColor = COLORS.WHITE,
  titleColor = COLORS.DARK,
  style,
}) => {
  return (
    <View style={[styles.container, { backgroundColor }, style]}>
      {/* Botón de retroceso */}
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backIcon}>←</Text>
      </TouchableOpacity>

      {/* Título */}
      <View style={styles.titleContainer}>
        <Text style={[styles.title, { color: titleColor }]} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* Componente derecho opcional */}
      <View style={styles.rightSection}>
        {rightComponent}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.MD,
    paddingVertical: SPACING.SM,
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.GRAY_LIGHT,
  },

  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },

  backIcon: {
    fontSize: 24,
    color: COLORS.DARK,
    fontWeight: 'bold',
  },

  titleContainer: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: SPACING.SM,
  },

  title: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
    fontWeight: '600',
  },

  rightSection: {
    width: 40,
    alignItems: 'flex-end',
  },
});

export default NavHeader;