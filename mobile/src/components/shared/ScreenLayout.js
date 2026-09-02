import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants/theme';

/**
 * ScreenLayout Component
 * 
 * Un componente contenedor universal que aplica SafeAreaInsets de manera flexible.
 * Envuelve el contenido en un View con el padding adecuado para respetar notch y barras.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido de la pantalla
 * @param {Object} props.style - Estilos adicionales para el contenedor interno
 * @param {string} props.backgroundColor - Color de fondo opcional (usa COLORS.background por defecto)
 * @param {boolean} props.bottom - Si debe aplicar padding inferior (por defecto true)
 * @param {boolean} props.top - Si debe aplicar padding superior (por defecto true)
 */
const ScreenLayout = ({ 
  children, 
  style, 
  backgroundColor = COLORS.background,
  bottom = true,
  top = true
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor,
        paddingTop: top ? insets.top : 0,
        paddingBottom: bottom ? insets.bottom : 0,
        paddingLeft: insets.left,
        paddingRight: insets.right
      }
    ]}>
      <View style={[styles.content, style]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});

export default ScreenLayout;
