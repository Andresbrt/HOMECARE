import React from 'react';
import { Text, View, ActivityIndicator } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { COLORS, TYPOGRAPHY, SPACING } from '../theme';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  RequestIcon,
  HistoryIcon,
  ProfileIcon,
  BriefcaseIcon,
  CalendarIcon,
  MoneyIcon,
  DashboardIcon,
  UsersIcon,
  ReportsIcon,
  SettingsIcon
} from '../components/common/Icon';

// Pantallas de autenticación
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Pantallas de cliente
import ClientHomeScreen from '../screens/client/ClientHomeScreen';
import ClientProfileScreen from '../screens/client/ClientProfileScreen';
import TrackingScreen from '../screens/client/TrackingScreen';
import ServiceDetailsScreen from '../screens/client/ServiceDetailsScreen';
import RequestServiceScreen from '../screens/client/RequestServiceScreen';
import ServiceHistoryScreen from '../screens/client/ServiceHistoryScreen';
import PaymentScreen from '../screens/client/PaymentScreen';
import RealTimeTrackingScreen from '../screens/client/RealTimeTrackingScreen';

// Pantallas de proveedor
import ProviderHomeScreen from '../screens/provider/ProviderHomeScreen';
import ActiveServiceScreen from '../screens/provider/ActiveServiceScreen';
import EarningsScreen from '../screens/provider/EarningsScreen';
import ScheduleScreen from '../screens/provider/ScheduleScreen';
import ProviderProfileScreen from '../screens/provider/ProviderProfileScreen';

// Pantallas de administrador
import AdminDashboardScreen from '../screens/admin/DashboardScreen';
import UsersManagementScreen from '../screens/admin/UsersManagementScreen';
import ReportsScreen from '../screens/admin/ReportsScreen';
import SettingsScreen from '../screens/admin/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

/**
 * NAVEGADOR PRINCIPAL CON AUTENTICACIÓN
 * Maneja la navegación basada en el estado de autenticación
 */
const AppNavigator = () => {
  const { user, isAuthenticated, initializing } = useAuth();

  // Mostrar loading durante inicialización
  if (initializing) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center',
        backgroundColor: COLORS.WHITE 
      }}>
        <ActivityIndicator size="large" color={COLORS.PRIMARY} />
        <Text style={{ 
          marginTop: SPACING.MD, 
          fontSize: TYPOGRAPHY.FONT_SIZE.MD,
          color: COLORS.GRAY_DARK 
        }}>
          Cargando...
        </Text>
      </View>
    );
  }

  // Si no está autenticado, mostrar pantallas de auth
  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  // Si está autenticado, mostrar navegación según rol
  switch (user?.role) {
    case 'provider':
      return <ProviderTabNavigator />;
    case 'admin':
      return <AdminStackNavigator />;
    case 'customer':
    default:
      return <ClientTabNavigator />;
  }
};

/**
 * NAVEGACIÓN DE AUTENTICACIÓN
 */
const AuthNavigator = () => (
  <Stack.Navigator 
    screenOptions={{ headerShown: false }}
    initialRouteName="Login"
  >
    <Stack.Screen name="Login" component={LoginScreen} />
    <Stack.Screen name="Register" component={RegisterScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
  </Stack.Navigator>
);

/**
 * NAVEGACIÓN PRINCIPAL POR ROLES
 * Cada rol tiene su propia estructura de navegación
 */

// Stack Navigator para Cliente
const ClientStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ClientHome" component={ClientHomeScreen} />
    <Stack.Screen name="RequestService" component={RequestServiceScreen} />
    <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
    <Stack.Screen name="Tracking" component={TrackingScreen} />
    <Stack.Screen name="RealTimeTracking" component={RealTimeTrackingScreen} />
    <Stack.Screen name="Payment" component={PaymentScreen} />
  </Stack.Navigator>
);

// Stack Navigator para Servicios del Cliente
const ServiceHistoryStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ServiceHistory" component={ServiceHistoryScreen} />
    <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
    <Stack.Screen name="Tracking" component={TrackingScreen} />
    <Stack.Screen name="RealTimeTracking" component={RealTimeTrackingScreen} />
    <Stack.Screen name="Payment" component={PaymentScreen} />
  </Stack.Navigator>
);

// Stack Navigator para Perfil del Cliente
const ClientProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={ClientProfileScreen} />
    <Stack.Screen name="ServiceHistory" component={ServiceHistoryScreen} />
    <Stack.Screen name="Payment" component={PaymentScreen} />
  </Stack.Navigator>
);

// Stack Navigator para Proveedor
const ProviderStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProviderHome" component={ProviderHomeScreen} />
    <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
    <Stack.Screen name="ActiveService" component={ActiveServiceScreen} />
    <Stack.Screen name="RealTimeTracking" component={RealTimeTrackingScreen} />
  </Stack.Navigator>
);

// Stack Navigator para Solicitudes del Proveedor
const ProviderRequestsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AvailableRequests" component={ProviderHomeScreen} />
    <Stack.Screen name="ServiceDetails" component={ServiceDetailsScreen} />
    <Stack.Screen name="ActiveService" component={ActiveServiceScreen} />
  </Stack.Navigator>
);

// Stack Navigator para Horario del Proveedor
const ProviderScheduleStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Schedule" component={ScheduleScreen} />
  </Stack.Navigator>
);

// Stack Navigator para Ganancias del Proveedor
const ProviderEarningsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Earnings" component={EarningsScreen} />
  </Stack.Navigator>
);

// Stack Navigator para Perfil del Proveedor
const ProviderProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Profile" component={ProviderProfileScreen} />
  </Stack.Navigator>
);

// Stack Navigator para Administrador
const AdminStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
  </Stack.Navigator>
);

// Stack Navigator para Gestión de Usuarios
const AdminUsersStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="UsersManagement" component={UsersManagementScreen} />
  </Stack.Navigator>
);

// Stack Navigator para Reportes
const AdminReportsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Reports" component={ReportsScreen} />
  </Stack.Navigator>
);

// Stack Navigator para Configuración
const AdminSettingsStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="Settings" component={SettingsScreen} />
  </Stack.Navigator>
);

/**
 * TAB NAVIGATOR PARA CLIENTES
 */
const ClientTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        switch (route.name) {
          case 'Home':
            return <HomeIcon focused={focused} size={size} color={color} />;
          case 'RequestService':
            return <RequestIcon focused={focused} size={size} color={color} />;
          case 'Bookings':
            return <HistoryIcon focused={focused} size={size} color={color} />;
          case 'Profile':
            return <ProfileIcon focused={focused} size={size} color={color} />;
          default:
            return <Text style={{ fontSize: size, color }}>•</Text>;
        }
      },
      tabBarActiveTintColor: COLORS.PRIMARY,
      tabBarInactiveTintColor: COLORS.GRAY_DARK,
      tabBarStyle: {
        backgroundColor: COLORS.WHITE,
        borderTopColor: COLORS.GRAY_LIGHT,
        paddingBottom: 5,
        height: 60,
        elevation: 8,
        shadowColor: COLORS.DARK,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      tabBarLabelStyle: {
        fontSize: TYPOGRAPHY.FONT_SIZE.XS,
        fontWeight: '600',
        marginTop: -2,
      },
    })}
  >
    <Tab.Screen
      name="Home"
      component={ClientStack}
      options={{ title: 'Inicio' }}
    />
    <Tab.Screen
      name="RequestService"
      component={RequestServiceScreen}
      options={{ title: 'Solicitar' }}
    />
    <Tab.Screen
      name="Bookings"
      component={ServiceHistoryStack}
      options={{ title: 'Mis Servicios' }}
    />
    <Tab.Screen
      name="Profile"
      component={ClientProfileStack}
      options={{ title: 'Perfil' }}
    />
  </Tab.Navigator>
);

/**
 * TAB NAVIGATOR PARA PROVEEDORES
 */
const ProviderTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        switch (route.name) {
          case 'Home':
            return <HomeIcon focused={focused} size={size} color={color} />;
          case 'Requests':
            return <BriefcaseIcon focused={focused} size={size} color={color} />;
          case 'Schedule':
            return <CalendarIcon focused={focused} size={size} color={color} />;
          case 'Earnings':
            return <MoneyIcon focused={focused} size={size} color={color} />;
          case 'Profile':
            return <ProfileIcon focused={focused} size={size} color={color} />;
          default:
            return <Text style={{ fontSize: size, color }}>•</Text>;
        }
      },
      tabBarActiveTintColor: COLORS.SECONDARY,
      tabBarInactiveTintColor: COLORS.GRAY_DARK,
      tabBarStyle: {
        backgroundColor: COLORS.WHITE,
        borderTopColor: COLORS.GRAY_LIGHT,
        paddingBottom: 5,
        height: 60,
        elevation: 8,
        shadowColor: COLORS.DARK,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      tabBarLabelStyle: {
        fontSize: TYPOGRAPHY.FONT_SIZE.XS,
        fontWeight: '600',
        marginTop: -2,
      },
    })}
  >
    <Tab.Screen
      name="Home"
      component={ProviderStack}
      options={{ title: 'Inicio' }}
    />
    <Tab.Screen
      name="Requests"
      component={ProviderRequestsStack}
      options={{ title: 'Solicitudes' }}
    />
    <Tab.Screen
      name="Schedule"
      component={ProviderScheduleStack}
      options={{ title: 'Horario' }}
    />
    <Tab.Screen
      name="Earnings"
      component={ProviderEarningsStack}
      options={{ title: 'Ganancias' }}
    />
    <Tab.Screen
      name="Profile"
      component={ProviderProfileStack}
      options={{ title: 'Perfil' }}
    />
  </Tab.Navigator>
);

/**
 * TAB NAVIGATOR PARA ADMINISTRADORES
 */
const AdminTabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarIcon: ({ focused, color, size }) => {
        switch (route.name) {
          case 'Dashboard':
            return <DashboardIcon focused={focused} size={size} color={color} />;
          case 'Users':
            return <UsersIcon focused={focused} size={size} color={color} />;
          case 'Reports':
            return <ReportsIcon focused={focused} size={size} color={color} />;
          case 'Settings':
            return <SettingsIcon focused={focused} size={size} color={color} />;
          default:
            return <Text style={{ fontSize: size, color }}>•</Text>;
        }
      },
      tabBarActiveTintColor: COLORS.DARK,
      tabBarInactiveTintColor: COLORS.GRAY_DARK,
      tabBarStyle: {
        backgroundColor: COLORS.WHITE,
        borderTopColor: COLORS.GRAY_LIGHT,
        paddingBottom: 5,
        height: 60,
        elevation: 8,
        shadowColor: COLORS.DARK,
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      tabBarLabelStyle: {
        fontSize: TYPOGRAPHY.FONT_SIZE.XS,
        fontWeight: '600',
        marginTop: -2,
      },
    })}
  >
    <Tab.Screen
      name="Dashboard"
      component={AdminStack}
      options={{ title: 'Dashboard' }}
    />
    <Tab.Screen
      name="Users"
      component={AdminUsersStack}
      options={{ title: 'Usuarios' }}
    />
    <Tab.Screen
      name="Reports"
      component={AdminReportsStack}
      options={{ title: 'Reportes' }}
    />
    <Tab.Screen
      name="Settings"
      component={AdminSettingsStack}
      options={{ title: 'Configuración' }}
    />
  </Tab.Navigator>
);

/**
 * AdminStackNavigator para cuando el usuario es admin
 */
const AdminStackNavigator = () => (
  <AdminTabNavigator />
);

export default AppNavigator;