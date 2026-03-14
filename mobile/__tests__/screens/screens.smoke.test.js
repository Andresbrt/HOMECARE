/**
 * Smoke tests: verify key screens render without crashing.
 */

import React from 'react';
import { render } from '@testing-library/react-native';

// ── Common mocks ──────────────────────────────────────

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn().mockResolvedValue(null),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  ImpactFeedbackStyle: { Medium: 'Medium' },
  NotificationFeedbackType: { Warning: 'Warning' },
}));

jest.mock('expo-constants', () => ({
  expoConfig: { extra: {} },
}));

// Mock @expo/vector-icons — renders as plain Text with the icon name
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Ionicons = (props) => React.createElement(Text, null, props.name || 'icon');
  return { Ionicons };
});

jest.mock('../../src/services/apiClient', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  },
}));

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  replace: jest.fn(),
};

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: {} }),
}));

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 1, nombre: 'Test', apellido: 'User', email: 'test@hc.com', rol: 'ROLE_CUSTOMER' },
    login: jest.fn().mockResolvedValue({ success: true }),
    register: jest.fn().mockResolvedValue({ success: true }),
    logout: jest.fn(),
    loading: false,
    isAuthenticated: true,
  }),
}));

// ── Tests ─────────────────────────────────────────────

describe('Screen smoke tests', () => {
  it('LoginScreen renders email and password fields', () => {
    const LoginScreen = require('../../src/screens/auth/LoginScreen').default;
    const { getByPlaceholderText } = render(
      React.createElement(LoginScreen, { navigation: mockNavigation })
    );

    expect(getByPlaceholderText('ejemplo@correo.com')).toBeTruthy();
  });

  it('RoleSelectionScreen renders two role cards', () => {
    const RoleSelectionScreen = require('../../src/screens/auth/RoleSelectionScreen').default;
    const { getByText } = render(
      React.createElement(RoleSelectionScreen, { navigation: mockNavigation })
    );

    expect(getByText('Necesito un servicio')).toBeTruthy();
    expect(getByText('Soy profesional')).toBeTruthy();
  });

  it('Customer HomeScreen renders greeting', () => {
    const HomeScreen = require('../../src/screens/customer/HomeScreen').default;
    const { getByText } = render(
      React.createElement(HomeScreen, { navigation: mockNavigation })
    );

    expect(getByText(/Hola/)).toBeTruthy();
  });

  it('Provider HomeScreen renders greeting', () => {
    const HomeScreen = require('../../src/screens/provider/HomeScreen').default;
    const { getByText } = render(
      React.createElement(HomeScreen, { navigation: mockNavigation })
    );

    expect(getByText(/Hola/)).toBeTruthy();
  });

  it('ProfileScreen renders user name and email', () => {
    const ProfileScreen = require('../../src/screens/shared/ProfileScreen').default;
    const { getByText } = render(
      React.createElement(ProfileScreen, { navigation: mockNavigation })
    );

    expect(getByText('Test User')).toBeTruthy();
    expect(getByText('test@hc.com')).toBeTruthy();
  });

  it('ErrorBoundary renders children when no error', () => {
    const ErrorBoundary = require('../../src/components/ErrorBoundary').default;
    const child = React.createElement(require('react-native').Text, null, 'child content');
    const { getByText } = render(
      React.createElement(ErrorBoundary, null, child)
    );

    expect(getByText('child content')).toBeTruthy();
  });
});
