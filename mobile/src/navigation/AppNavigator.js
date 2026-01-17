/**
 * AppNavigator - Navegación principal de la app
 * Stack Navigator para cliente y proveedor
 */

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { useAuth } from '../context/AuthContext';
import { COLORS } from '../constants/theme';

// Auth Screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import RoleSelectionScreen from '../screens/auth/RoleSelectionScreen';

// Customer Screens
import CustomerHomeScreen from '../screens/customer/HomeScreen';
import CreateRequestScreen from '../screens/customer/CreateRequestScreen';
import ViewOffersScreen from '../screens/customer/ViewOffersScreen';
import ServiceTrackingScreen from '../screens/customer/ServiceTrackingScreen';

// Provider Screens
import ProviderHomeScreen from '../screens/provider/HomeScreen';
import AvailableRequestsScreen from '../screens/provider/AvailableRequestsScreen';
import SendOfferScreen from '../screens/provider/SendOfferScreen';
import MyOffersScreen from '../screens/provider/MyOffersScreen';

// Shared Screens
import ChatScreen from '../screens/shared/ChatScreen';
import ProfileScreen from '../screens/shared/ProfileScreen';
import HistoryScreen from '../screens/shared/HistoryScreen';
import NotificationsScreen from '../screens/shared/NotificationsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Opciones de estilo minimalista
const screenOptions = {
  headerStyle: {
    backgroundColor: COLORS.primary,
    elevation: 0,
    shadowOpacity: 0,
  },
  headerTintColor: COLORS.white,
  headerTitleStyle: {
    fontFamily: 'Arial Narrow',
    fontWeight: '600',
    fontSize: 18,
  },
};

const tabOptions = {
  tabBarActiveTintColor: COLORS.accent,
  tabBarInactiveTintColor: COLORS.textDisabled,
  tabBarStyle: {
    backgroundColor: COLORS.white,
    borderTopColor: COLORS.border,
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
    paddingTop: 8,
  },
  tabBarLabelStyle: {
    fontFamily: 'Arial Narrow',
    fontSize: 12,
  },
  headerStyle: {
    backgroundColor: COLORS.primary,
  },
  headerTintColor: COLORS.white,
  headerTitleStyle: {
    fontFamily: 'Arial Narrow',
    fontWeight: '600',
  },
};

// Tabs para Cliente
function CustomerTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen
        name="CustomerHome"
        component={CustomerHomeScreen}
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{
          title: 'Historial',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Tabs para Proveedor
function ProviderTabs() {
  return (
    <Tab.Navigator screenOptions={tabOptions}>
      <Tab.Screen
        name="ProviderHome"
        component={ProviderHomeScreen}
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="AvailableRequests"
        component={AvailableRequestsScreen}
        options={{
          title: 'Solicitudes',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MyOffers"
        component={MyOffersScreen}
        options={{
          title: 'Mis Ofertas',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pricetag-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { isAuthenticated, loading, isCustomer } = useAuth();

  if (loading) {
    return null; // O un splash screen
  }

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {!isAuthenticated ? (
        // Auth Stack
        <>
          <Stack.Screen
            name="RoleSelection"
            component={RoleSelectionScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ title: 'Iniciar Sesión' }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{ title: 'Registrarse' }}
          />
        </>
      ) : (
        // Main App Stack
        <>
          <Stack.Screen
            name="Main"
            component={isCustomer() ? CustomerTabs : ProviderTabs}
            options={{ headerShown: false }}
          />
          
          {/* Pantallas compartidas */}
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ title: 'Chat' }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ title: 'Notificaciones' }}
          />
          
          {/* Pantallas del cliente */}
          <Stack.Screen
            name="CreateRequest"
            component={CreateRequestScreen}
            options={{ title: 'Nueva Solicitud' }}
          />
          <Stack.Screen
            name="ViewOffers"
            component={ViewOffersScreen}
            options={{ title: 'Ver Ofertas' }}
          />
          <Stack.Screen
            name="ServiceTracking"
            component={ServiceTrackingScreen}
            options={{ title: 'Seguimiento' }}
          />
          
          {/* Pantallas del proveedor */}
          <Stack.Screen
            name="SendOffer"
            component={SendOfferScreen}
            options={{ title: 'Enviar Oferta' }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}
