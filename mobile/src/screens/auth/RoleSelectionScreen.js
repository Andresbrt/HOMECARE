import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

export default function RoleSelectionScreen({ navigation }) {
  const insets = useSafeAreaInsets();

  const handleSelect = (role) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Register', { role });
  };

  return (
    <LinearGradient colors={['#000F22', '#001B38', '#0a2a42']} style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <View
        style={[
          styles.container,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 36 },
        ]}
      >
        {/* Logo */}
        <Animated.View entering={FadeInDown.duration(600).springify()} style={styles.logoArea}>
          <Image
            source={require('../../../assets/icon.png')}
            style={styles.logoImg}
            resizeMode="contain"
          />
          <Text style={styles.tagline}>¿Cómo quieres usar la app?</Text>
        </Animated.View>

        {/* Cards */}
        <View style={styles.cardsContainer}>
          {/* Cliente */}
          <Animated.View entering={FadeInDown.duration(500).delay(120).springify()}>
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleSelect('CUSTOMER')}
              activeOpacity={0.82}
            >
              <LinearGradient
                colors={['rgba(73,192,188,0.18)', 'rgba(73,192,188,0.05)']}
                style={styles.cardGradient}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.iconCircle, styles.iconTeal]}>
                    <MaterialCommunityIcons name="home-search-outline" size={30} color={PROF.accent} />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>Necesito un servicio</Text>
                    <Text style={styles.cardDesc}>
                      Publica solicitudes y recibe ofertas de profesionales verificados.
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={22} color={PROF.accent} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Profesional */}
          <Animated.View entering={FadeInDown.duration(500).delay(230).springify()}>
            <TouchableOpacity
              style={[styles.card, styles.cardBlue]}
              onPress={() => handleSelect('SERVICE_PROVIDER')}
              activeOpacity={0.82}
            >
              <LinearGradient
                colors={['rgba(14,77,104,0.6)', 'rgba(14,77,104,0.22)']}
                style={styles.cardGradient}
              >
                <View style={styles.cardLeft}>
                  <View style={[styles.iconCircle, styles.iconBlue]}>
                    <MaterialCommunityIcons name="briefcase-check-outline" size={30} color="#57C8E8" />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>Soy profesional</Text>
                    <Text style={styles.cardDesc}>
                      Encuentra solicitudes cercanas y envía ofertas competitivas.
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={22} color="#57C8E8" />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Footer */}
        <Animated.View entering={FadeInUp.duration(500).delay(360)} style={styles.footer}>
          <TouchableOpacity onPress={() => navigation.navigate('Login')} activeOpacity={0.7}>
            <Text style={styles.footerText}>
              ¿Ya tienes cuenta?{' '}
              <Text style={styles.footerLink}>Inicia sesión</Text>
            </Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'space-between',
  },
  logoArea: {
    alignItems: 'center',
  },
  logoImg: {
    width: 130,
    height: 130,
    marginBottom: SPACING.md,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: 'rgba(73,192,188,0.35)',
  },
  tagline: {
    fontSize: TYPOGRAPHY.lg,
    color: PROF.textSecondary,
    textAlign: 'center',
  },
  cardsContainer: {
    gap: SPACING.md,
  },
  card: {
    borderRadius: BORDER_RADIUS.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(73,192,188,0.25)',
  },
  cardBlue: {
    borderColor: 'rgba(87,200,232,0.25)',
  },
  cardGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.sm,
  },
  cardLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTeal: {
    backgroundColor: 'rgba(73,192,188,0.18)',
    borderColor: 'rgba(73,192,188,0.45)',
  },
  iconBlue: {
    backgroundColor: 'rgba(14,77,104,0.5)',
    borderColor: 'rgba(87,200,232,0.45)',
  },
  cardText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    color: PROF.textPrimary,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: TYPOGRAPHY.sm,
    color: PROF.textSecondary,
    lineHeight: 18,
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: TYPOGRAPHY.md,
    color: PROF.textMuted,
  },
  footerLink: {
    color: PROF.accent,
    fontWeight: '700',
  },
});
