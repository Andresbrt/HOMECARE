/**
 * AppNavigator — Navegación principal Homecare 2026
 * Modo Profesional : Drawer oscuro → Tabs (ProfDashboard / ProfMap / ProfWallet / ProfPerformance)
 * Modo Usuario     : Stack oscuro premium → UserMap como raíz (MapScreen.js)
 */

import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import useModeStore from '../store/modeStore';
import { COLORS, PROF } from '../constants/theme';

// Professional Screens
import ProfDashboardScreen from '../screens/profesional/DashboardScreen';
import ProfMapScreen from '../screens/profesional/MapScreen';
import ProfWalletScreen from '../screens/profesional/WalletScreen';
import ProfPerformanceScreen from '../screens/profesional/PerformanceScreen';
import DrawerContent from '../components/profesional/DrawerContent';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// ─── Usuario premium (dark map UX) ──────────────────────────────────────────
import UserMapScreen from '../screens/usuario/MapScreen';

// Screens usadas en el stack de usuario
import CreateRequestScreen from '../screens/customer/CreateRequestScreen';
import ViewOffersScreen from '../screens/customer/ViewOffersScreen';
import ServiceTrackingScreen from '../screens/customer/ServiceTrackingScreen';

// Screens exclusivas del modo profesional
import AvailableRequestsScreen from '../screens/provider/AvailableRequestsScreen';
import SendOfferScreen from '../screens/provider/SendOfferScreen';

// Screens compartidas
import ChatScreen from '../screens/shared/ChatScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import HistoryScreen from '../screens/shared/HistoryScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// ─── Opciones de tab para modo PROFESIONAL (dark) ────────────────────────────
const profTabOptions = {
  tabBarActiveTintColor: PROF.accent,
  tabBarInactiveTintColor: PROF.textMuted,
  tabBarStyle: {
    backgroundColor: PROF.bgElevated,
    borderTopColor: PROF.border,
    borderTopWidth: 1,
    height: 62,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
  headerShown: false,
};

// ─── Opciones compartidas de Stack ───────────────────────────────────────────
const screenOptions = {
  headerStyle: { backgroundColor: COLORS.primary, elevation: 0, shadowOpacity: 0 },
  headerTintColor: COLORS.white,
  headerTitleStyle: { fontWeight: '600', fontSize: 18 },
};

// ─── Opciones de Stack oscuro premium (modo usuario) ─────────────────────────
const darkStackOptions = {
  headerStyle: {
    backgroundColor: PROF.bgElevated,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: PROF.border,
  },
  headerTintColor: PROF.textPrimary,
  headerTitleStyle: { fontWeight: '700', fontSize: 17, color: PROF.textPrimary },
  cardStyle: { backgroundColor: PROF.bg },
};

// ─── Stack USUARIO PREMIUM — UserMap como pantalla raíz ─────────────────────
// Todos en modo oscuro, sin tabs: mapa full-screen + pantallas de servicio
function UserModeStack() {
  return (
    <Stack.Navigator screenOptions={darkStackOptions}>
      {/* 1. Raíz: mapa full-screen, sin header, sin gesto de retroceso */}
      <Stack.Screen
        name="UserMap"
        component={UserMapScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      {/* 2. Solicitar un servicio */}
      <Stack.Screen
        name="ServiceRequest"
        component={CreateRequestScreen}
        options={{ title: 'Nueva Solicitud' }}
      />
      {/* 3. Ver ofertas recibidas */}
      <Stack.Screen
        name="ViewOffers"
        component={ViewOffersScreen}
        options={{ title: 'Ofertas Recibidas' }}
      />
      {/* 4. Seguimiento del proveedor en tiempo real */}
      <Stack.Screen
        name="ServiceTracking"
        component={ServiceTrackingScreen}
        options={{ title: 'Seguimiento' }}
      />
      {/* 5. Chat con el proveedor */}
      <Stack.Screen
        name="UserChat"
        component={ChatScreen}
        options={{ title: 'Chat' }}
      />
      {/* 6. Historial de servicios */}
      <Stack.Screen
        name="UserHistory"
        component={HistoryScreen}
        options={{ title: 'Historial' }}
      />
      {/* 7. Perfil del usuario */}
      <Stack.Screen
        name="UserProfile"
        component={ProfileScreen}
        options={{ title: 'Mi Perfil' }}
      />
      {/* 8. Notificaciones */}
      <Stack.Screen
        name="UserNotifications"
        component={NotificationsScreen}
        options={{ title: 'Notificaciones' }}
      />
    </Stack.Navigator>
  );
}

// ─── Tabs PROFESIONAL (modo premium oscuro) ───────────────────────────────────
function ProfessionalTabs() {
  return (
    <Tab.Navigator screenOptions={profTabOptions}>
      <Tab.Screen
        name="ProfDashboard"
        component={ProfDashboardScreen}
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => <Ionicons name="home" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfMap"
        component={ProfMapScreen}
        options={{
          title: 'Mapa',
          tabBarIcon: ({ color, size }) => <Ionicons name="map" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfPerformance"
        component={ProfPerformanceScreen}
        options={{
          title: 'Desempeño',
          tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfWallet"
        component={ProfWalletScreen}
        options={{
          title: 'Cartera',
          tabBarIcon: ({ color, size }) => <Ionicons name="wallet" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Drawer + Tabs para modo PROFESIONAL ─────────────────────────────────────
function ProfessionalDrawer() {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'slide',
        drawerStyle: { width: Math.min(280, Dimensions.get('window').width * 0.82), backgroundColor: PROF.bg },
        overlayColor: 'rgba(0,0,0,0.6)',
        sceneStyle: { backgroundColor: PROF.bg },
      }}
    >
      <Drawer.Screen name="ProfMain" component={ProfessionalTabs} />
    </Drawer.Navigator>
  );
}

// ─── Navigator principal ──────────────────────────────────────────────────────
export default function AppNavigator() {
  const { isAuthenticated, loading, user } = useAuth();
  const { mode, setMode } = useModeStore();

  // Sincronizar modo con el rol del usuario al autenticarse
  useEffect(() => {
    if (user) {
      const defaultMode = user.rol === 'SERVICE_PROVIDER' ? 'profesional' : 'usuario';
      setMode(defaultMode);
    }
  }, [user]);

  if (loading) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="large" color={COLORS.accent} />
      </View>
    );
  }

  const isProfessional = isAuthenticated && mode === 'profesional';
  const isUserMode = isAuthenticated && mode === 'usuario';

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isAuthenticated ? (
        // ── Auth Stack ──
        <>
          <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} options={{ headerShown: false }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ title: 'Iniciar Sesión' }} />
          <Stack.Screen name="Register" component={RegisterScreen} options={{ title: 'Registrarse' }} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: 'Recuperar Contraseña' }} />
        </>
      ) : isProfessional ? (
        // ── Modo Profesional: Drawer + Tabs oscuros ──
        <>
          <Stack.Screen name="Main" component={ProfessionalDrawer} options={{ headerShown: false }} />
          <Stack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
          <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: 'Notificaciones' }} />
          <Stack.Screen name="AvailableRequests" component={AvailableRequestsScreen} options={{ title: 'Solicitudes' }} />
          <Stack.Screen name="SendOffer" component={SendOfferScreen} options={{ title: 'Enviar Oferta' }} />
          <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Perfil' }} />
        </>
      ) : (
        // ── Modo Usuario: Stack oscuro premium, UserMap como raíz ──
        // El primer screen en registrarse es el que se muestra automáticamente.
        // UserMap = pantalla raíz → al llamar setMode('usuario') siempre aterriza aquí.
        <Stack.Screen
          name="UserRoot"
          component={UserModeStack}
          options={{ headerShown: false, gestureEnabled: false }}
        />
      )}
    </Stack.Navigator>
  );
}

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});

/*
 * INSTRUCCIONES DE USO
 * ─────────────────────────────────────────────────────────────
 * CAMBIO DE MODO
 *   const { setMode } = useModeStore();
 *   setMode('usuario');      → va directo a UserMap (MapScreen usuario)
 *   setMode('profesional');  → va directo al Dashboard profesional
 *
 * NAVEGACIÓN DENTRO DEL MODO USUARIO (desde UserMapScreen):
 *   navigation.navigate('ServiceRequest')     → Nueva solicitud
 *   navigation.navigate('ViewOffers')         → Ofertas recibidas
 *   navigation.navigate('ServiceTracking')    → Seguimiento en tiempo real
 *   navigation.navigate('UserChat')           → Chat con proveedor
 *   navigation.navigate('UserHistory')        → Historial de servicios
 *   navigation.navigate('UserProfile')        → Mi perfil
 *   navigation.navigate('UserNotifications')  → Notificaciones
 *
 * NOTA: Al llamar setMode() desde DrawerContent no se necesita navigation.navigate()
 * porque el re-render de AppNavigator monta la nueva pila automáticamente.
 */

