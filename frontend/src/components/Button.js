import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, DIMENSIONS, BORDER_RADIUS, SHADOWS } from '../theme';

/**
 * BOTÓN PRINCIPAL HOMECARE
 * Variantes:
 * - primary: Turquesa para acciones principales
 * - secondary: Azul petróleo para acciones secundarias  
 * - outline: Solo borde para acciones terciarias
 * - danger: Rojo para acciones destructivas
 */
export const Button = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon,
  fullWidth = false,
  ...props
}) => {
  const getButtonStyle = () => {
    const base = [styles.button];
    
    // Tamaño
    if (size === 'small') base.push(styles.buttonSmall);
    if (size === 'large') base.push(styles.buttonLarge);
    
    // Ancho completo
    if (fullWidth) base.push(styles.buttonFullWidth);
    
    // Variantes de color
    if (variant === 'primary') base.push(styles.buttonPrimary);
    if (variant === 'secondary') base.push(styles.buttonSecondary);
    if (variant === 'outline') base.push(styles.buttonOutline);
    if (variant === 'danger') base.push(styles.buttonDanger);
    
    // Estados
    if (disabled) base.push(styles.buttonDisabled);
    
    return base;
  };

  const getTextStyle = () => {
    const base = [styles.buttonText];
    
    // Tamaño de texto
    if (size === 'small') base.push(styles.buttonTextSmall);
    if (size === 'large') base.push(styles.buttonTextLarge);
    
    // Color según variante
    if (variant === 'primary') base.push(styles.textPrimary);
    if (variant === 'secondary') base.push(styles.textSecondary);
    if (variant === 'outline') base.push(styles.textOutline);
    if (variant === 'danger') base.push(styles.textDanger);
    
    // Estado deshabilitado
    if (disabled) base.push(styles.textDisabled);
    
    return base;
  };

  return (
    <TouchableOpacity
      style={[...getButtonStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'outline' ? COLORS.PRIMARY : COLORS.WHITE}
        />
      ) : (
        <View style={styles.buttonContent}>
          {icon && <View style={styles.iconContainer}>{icon}</View>}
          <Text style={[...getTextStyle(), textStyle]}>
            {title}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: DIMENSIONS.BUTTON_HEIGHT,
    paddingHorizontal: SPACING.LG,
    borderRadius: BORDER_RADIUS.MD,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    ...SHADOWS.MEDIUM,
  },
  
  buttonSmall: {
    height: 36,
    paddingHorizontal: SPACING.MD,
  },
  
  buttonLarge: {
    height: 56,
    paddingHorizontal: SPACING.XL,
  },
  
  buttonFullWidth: {
    alignSelf: 'stretch',
  },
  
  // Variantes de color
  buttonPrimary: {
    backgroundColor: COLORS.PRIMARY,
    borderWidth: 0,
  },
  
  buttonSecondary: {
    backgroundColor: COLORS.SECONDARY,
    borderWidth: 0,
  },
  
  buttonOutline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.PRIMARY,
  },
  
  buttonDanger: {
    backgroundColor: COLORS.ERROR,
    borderWidth: 0,
  },
  
  buttonDisabled: {
    backgroundColor: COLORS.GRAY_MEDIUM,
    borderColor: COLORS.GRAY_MEDIUM,
  },
  
  // Contenido del botón
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  
  iconContainer: {
    marginRight: SPACING.SM,
  },
  
  // Estilos de texto
  buttonText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    fontWeight: '600',
    textAlign: 'center',
  },
  
  buttonTextSmall: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
  },
  
  buttonTextLarge: {
    fontSize: TYPOGRAPHY.FONT_SIZE.LG,
  },
  
  textPrimary: {
    color: COLORS.WHITE,
  },
  
  textSecondary: {
    color: COLORS.WHITE,
  },
  
  textOutline: {
    color: COLORS.PRIMARY,
  },
  
  textDanger: {
    color: COLORS.WHITE,
  },
  
  textDisabled: {
    color: COLORS.GRAY_DARK,
  },
});

export default Button;