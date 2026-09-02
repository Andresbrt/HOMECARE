/**
 * OnboardingScreen — Bienvenida Premium Homecare 2026
 * Se muestra una sola vez al instalar la app.
 * Persiste "onboardingDone=true" en SecureStore al finalizar.
 */
import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import * as SecureStore from 'expo-secure-store';
import { PROF, TYPOGRAPHY, SPACING, BORDER_RADIUS } from '../../constants/theme';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    key: 'welcome',
    icon: 'color-palette',
    gradient: ['#49C0BC', '#2a9d99'],
    title: 'Bienvenido a\nHomecare',
    subtitle: 'La plataforma premium de\nservicios de colorimetría a domicilio',
    tag: 'Calidad en cada visita',
  },
  {
    key: 'client',
    icon: 'search',
    gradient: ['#001B38', '#0E4D68'],
    title: 'Para clientes',
    subtitle: 'Solicita servicios, recibe ofertas de\nprofesionales verificados y paga\nseguro desde la app',
    tag: 'Reserva en minutos',
    steps: ['Describe tu servicio', 'Recibe ofertas', 'Elige y agenda', 'Paga seguro'],
  },
  {
    key: 'professional',
    icon: 'briefcase',
    gradient: ['#0E4D68', '#001B38'],
    title: 'Para profesionales',
    subtitle: 'Acepta servicios, completa pedidos\ny aumenta tus ingresos con el\nsistema de rangos Básico → Elite',
    tag: 'Gana más, crece más',
    steps: ['Recibe solicitudes', 'Acepta y ve al cliente', 'Completa el servicio', 'Cobra y sube de rango'],
  },
  {
    key: 'start',
    icon: 'rocket',
    gradient: ['#49C0BC', '#0E4D68'],
    title: '¡Todo listo!',
    subtitle: 'Regístrate o inicia sesión para\nempezar a disfrutar la experiencia\nHomecare',
    tag: 'Seguro · Confiable · Premium',
  },
];

function Slide({ item }) {
  return (
    <View style={[styles.slide, { width }]}>
      <LinearGradient
        colors={[item.gradient[0] + '40', item.gradient[1] + '20']}
        style={styles.slideGradient}
      />
      <Animated.View entering={FadeIn.duration(600)} style={styles.iconWrap}>
        <LinearGradient colors={item.gradient} style={styles.iconCircle}>
          <Ionicons name={item.icon} size={52} color="#FFFFFF" />
        </LinearGradient>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.textBlock}>
        <View style={styles.tag}>
          <Ionicons name="flash" size={12} color={PROF.accent} />
          <Text style={styles.tagText}>{item.tag}</Text>
        </View>
        <Text style={styles.slideTitle}>{item.title}</Text>
        <Text style={styles.slideSubtitle}>{item.subtitle}</Text>
      </Animated.View>

      {item.steps ? (
        <Animated.View entering={FadeInDown.delay(300).duration(400)} style={styles.stepsBlock}>
          {item.steps.map((step, i) => (
            <View key={step} style={styles.stepRow}>
              <LinearGradient colors={PROF.gradAccent} style={styles.stepNum}>
                <Text style={styles.stepNumText}>{i + 1}</Text>
              </LinearGradient>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </Animated.View>
      ) : null}
    </View>
  );
}

export default function OnboardingScreen({ navigation }) {
  const flatRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const btnScale = useSharedValue(1);

  const isLast = currentIndex === SLIDES.length - 1;

  const btnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: btnScale.value }],
  }));

  const handleNext = () => {
    if (isLast) {
      finishOnboarding();
    } else {
      flatRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  };

  const finishOnboarding = async () => {
    await SecureStore.setItemAsync('onboardingDone', 'true');
    navigation.replace('Login');
  };

  const handleScroll = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentIndex(idx);
  };

  const handlePressIn = () => {
    btnScale.value = withSpring(0.95, { damping: 12 });
  };
  const handlePressOut = () => {
    btnScale.value = withSpring(1, { damping: 12 });
  };

  return (
    <LinearGradient colors={PROF.gradMain} style={styles.screen}>
      <StatusBar barStyle="light-content" backgroundColor="#000F22" />
      <SafeAreaView style={styles.safe}>

        {/* Skip */}
        <View style={styles.header}>
          <View style={{ flex: 1 }} />
          {!isLast && (
            <TouchableOpacity onPress={finishOnboarding} style={styles.skipBtn}>
              <Text style={styles.skipText}>Omitir</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Slides */}
        <FlatList
          ref={flatRef}
          data={SLIDES}
          keyExtractor={s => s.key}
          renderItem={({ item }) => <Slide item={item} />}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          scrollEventThrottle={16}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        />

        {/* Dots + Botón */}
        <View style={styles.footer}>
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === currentIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>

          <Animated.View style={btnStyle}>
            <TouchableOpacity
              onPress={handleNext}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              activeOpacity={0.9}
              style={styles.btnWrap}
            >
              <LinearGradient colors={PROF.gradAccent} style={styles.mainBtn}>
                <Text style={styles.mainBtnText}>
                  {isLast ? 'Comenzar' : 'Siguiente'}
                </Text>
                <Ionicons
                  name={isLast ? 'rocket-outline' : 'arrow-forward'}
                  size={20}
                  color="#fff"
                />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  safe:   { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
  },
  skipBtn: { padding: SPACING.sm },
  skipText: { fontSize: TYPOGRAPHY.sm, color: PROF.textSecondary, fontWeight: TYPOGRAPHY.medium },

  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    position: 'relative',
  },
  slideGradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.5,
  },
  iconWrap: { alignItems: 'center', marginBottom: SPACING.xl },
  iconCircle: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBlock: { alignItems: 'center', marginBottom: SPACING.md },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: PROF.accentDim,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    marginBottom: SPACING.md,
  },
  tagText: { fontSize: TYPOGRAPHY.xs, color: PROF.accent, fontWeight: TYPOGRAPHY.semibold },
  slideTitle: {
    fontSize: 30,
    fontWeight: TYPOGRAPHY.bold,
    color: PROF.textPrimary,
    textAlign: 'center',
    lineHeight: 36,
    marginBottom: SPACING.sm,
  },
  slideSubtitle: {
    fontSize: TYPOGRAPHY.md,
    color: PROF.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  stepsBlock: {
    width: '100%',
    gap: SPACING.sm,
    marginTop: SPACING.sm,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: PROF.glass,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: PROF.glassBorder,
  },
  stepNum: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  stepNumText: { fontSize: TYPOGRAPHY.xs, fontWeight: TYPOGRAPHY.bold, color: '#fff' },
  stepText:   { fontSize: TYPOGRAPHY.sm, color: PROF.textPrimary, fontWeight: TYPOGRAPHY.medium },

  footer: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    paddingTop: SPACING.sm,
    gap: SPACING.md,
  },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
  dot: {
    width: 7, height: 7,
    borderRadius: 4,
    backgroundColor: PROF.textMuted,
  },
  dotActive: {
    width: 24,
    backgroundColor: PROF.accent,
  },
  btnWrap: { borderRadius: BORDER_RADIUS.full, overflow: 'hidden' },
  mainBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md + 2,
    gap: SPACING.sm,
  },
  mainBtnText: { fontSize: TYPOGRAPHY.md, fontWeight: TYPOGRAPHY.bold, color: '#fff' },
});
