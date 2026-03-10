import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  Animated 
} from 'react-native';
import { COLORS, TYPOGRAPHY, SPACING, DIMENSIONS, BORDER_RADIUS } from '../theme';

/**
 * INPUT FIELD HOMECARE
 * Características:
 * - Floating label animado
 * - Estados de error/éxito
 * - Iconos opcionales
 * - Máscaras para teléfono, dinero, etc.
 * - Validación visual
 */
export const Input = ({
  label,
  placeholder,
  value,
  onChangeText,
  error,
  success,
  disabled = false,
  secureTextEntry = false,
  keyboardType = 'default',
  multiline = false,
  numberOfLines = 1,
  leftIcon,
  rightIcon,
  onRightIconPress,
  mask,
  style,
  inputStyle,
  labelStyle,
  maxLength,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [labelPosition] = useState(new Animated.Value(value ? 1 : 0));

  const handleFocus = () => {
    setIsFocused(true);
    animateLabel(1);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!value) {
      animateLabel(0);
    }
  };

  const animateLabel = (toValue) => {
    Animated.timing(labelPosition, {
      toValue,
      duration: 200,
      useNativeDriver: false,
    }).start();
  };

  const applyMask = (text) => {
    if (!mask) return text;
    
    switch (mask) {
      case 'phone':
        return text.replace(/\D/g, '').replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
      case 'currency':
        return text.replace(/\D/g, '').replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
      case 'date':
        return text.replace(/\D/g, '').replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
      default:
        return text;
    }
  };

  const getContainerStyle = () => {
    const base = [styles.container];
    if (error) base.push(styles.containerError);
    if (success) base.push(styles.containerSuccess);
    if (isFocused) base.push(styles.containerFocused);
    if (disabled) base.push(styles.containerDisabled);
    return base;
  };

  const animatedLabelStyle = {
    position: 'absolute',
    left: leftIcon ? 44 : SPACING.MD,
    top: labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [18, 4],
    }),
    fontSize: labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [TYPOGRAPHY.FONT_SIZE.MD, TYPOGRAPHY.FONT_SIZE.SM],
    }),
    color: labelPosition.interpolate({
      inputRange: [0, 1],
      outputRange: [
        isFocused ? COLORS.PRIMARY : COLORS.GRAY_DARK,
        error ? COLORS.ERROR : isFocused ? COLORS.PRIMARY : COLORS.GRAY_DARK,
      ],
    }),
  };

  return (
    <View style={[styles.wrapper, style]}>
      <View style={getContainerStyle()}>
        {/* Icono izquierdo */}
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}

        {/* Label flotante */}
        {label && (
          <Animated.Text style={animatedLabelStyle}>
            {label}
          </Animated.Text>
        )}

        {/* Input principal */}
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            multiline && styles.inputMultiline,
            inputStyle,
          ]}
          value={value}
          onChangeText={(text) => {
            const maskedText = applyMask(text);
            onChangeText(maskedText);
          }}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={isFocused ? placeholder : ''}
          placeholderTextColor={COLORS.GRAY_DARK}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={!disabled}
          maxLength={maxLength}
          accessible={true}
          accessibilityLabel={label || placeholder}
          accessibilityHint={error ? `Error: ${error}` : undefined}
          accessibilityState={{ disabled }}
          {...props}
        />

        {rightIcon && (
          <TouchableOpacity
            style={styles.rightIcon}
            onPress={onRightIconPress}
            disabled={!onRightIconPress}
          >
            {rightIcon}
          </TouchableOpacity>
        )}
      </View>

      {/* Mensajes de error/éxito */}
      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      {success && !error && (
        <Text style={styles.successText}>{success}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: SPACING.MD,
  },
  
  container: {
    minHeight: DIMENSIONS.INPUT_HEIGHT,
    borderWidth: 1.5,
    borderColor: COLORS.GRAY_MEDIUM,
    borderRadius: BORDER_RADIUS.MD,
    backgroundColor: COLORS.WHITE,
    paddingTop: SPACING.SM,
    position: 'relative',
  },
  
  containerFocused: {
    borderColor: COLORS.PRIMARY,
  },
  
  containerError: {
    borderColor: COLORS.ERROR,
  },
  
  containerSuccess: {
    borderColor: COLORS.SUCCESS,
  },
  
  containerDisabled: {
    backgroundColor: COLORS.GRAY_LIGHT,
    borderColor: COLORS.GRAY_MEDIUM,
  },
  
  input: {
    flex: 1,
    paddingHorizontal: SPACING.MD,
    paddingTop: SPACING.LG,
    paddingBottom: SPACING.SM,
    fontSize: TYPOGRAPHY.FONT_SIZE.MD,
    color: COLORS.DARK,
    minHeight: 40,
  },
  
  inputWithLeftIcon: {
    paddingLeft: 44,
  },
  
  inputWithRightIcon: {
    paddingRight: 44,
  },
  
  inputMultiline: {
    textAlignVertical: 'top',
    minHeight: 80,
  },
  
  leftIcon: {
    position: 'absolute',
    left: SPACING.MD,
    top: '50%',
    marginTop: -12,
    zIndex: 1,
  },
  
  rightIcon: {
    position: 'absolute',
    right: SPACING.MD,
    top: '50%',
    marginTop: -12,
    zIndex: 1,
  },
  
  errorText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.ERROR,
    marginTop: SPACING.XS,
    marginLeft: SPACING.SM,
  },
  
  successText: {
    fontSize: TYPOGRAPHY.FONT_SIZE.SM,
    color: COLORS.SUCCESS,
    marginTop: SPACING.XS,
    marginLeft: SPACING.SM,
  },
});

export default Input;