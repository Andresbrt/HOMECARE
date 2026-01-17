import React from 'react';
import { Text } from 'react-native';

// Componente de icono personalizado usando símbolos Unicode
export const Icon = ({ name, size = 20, color = '#000', style }) => {
  const getIcon = (iconName) => {
    const icons = {
      // Navegación General
      home: '🏠',
      'home-outline': '🏡',
      
      // Cliente
      search: '🔍',
      request: '📝',
      'request-outline': '📋',
      history: '📚',
      'history-outline': '📄',
      profile: '👤',
      'profile-outline': '👥',
      
      // Proveedor
      briefcase: '💼',
      'briefcase-outline': '📁',
      calendar: '📅',
      'calendar-outline': '📆',
      money: '💰',
      'money-outline': '💸',
      
      // Administrador
      dashboard: '📊',
      'dashboard-outline': '📈',
      users: '👥',
      'users-outline': '👤',
      reports: '📋',
      'reports-outline': '📄',
      settings: '⚙️',
      'settings-outline': '🔧',
      
      // Acciones
      add: '➕',
      edit: '✏️',
      delete: '🗑️',
      save: '💾',
      cancel: '❌',
      check: '✅',
      close: '✖️',
      
      // Navegación
      back: '←',
      forward: '→',
      up: '↑',
      down: '↓',
      chevron: '›',
      'chevron-left': '‹',
      'chevron-right': '›',
      'chevron-up': '⌃',
      'chevron-down': '⌄',
      
      // Estado
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️',
      
      // Comunicación
      phone: '📞',
      message: '💬',
      email: '📧',
      notification: '🔔',
      
      // Servicios
      cleaning: '🧹',
      cooking: '🍳',
      babysitter: '👶',
      eldercare: '👴',
      gardening: '🌿',
      repair: '🔧',
      
      // Transporte y ubicación
      location: '📍',
      map: '🗺️',
      navigation: '🧭',
      car: '🚗',
      
      // Pagos
      payment: '💳',
      wallet: '👛',
      cash: '💵',
      
      // Sistema
      refresh: '🔄',
      sync: '🔄',
      upload: '⬆️',
      download: '⬇️',
      export: '📤',
      import: '📥',
      
      // Rating
      star: '⭐',
      'star-outline': '☆',
      heart: '❤️',
      'heart-outline': '🤍',
      
      // Tiempo
      time: '⏰',
      clock: '🕐',
      timer: '⏱️',
      
      // Otros
      camera: '📷',
      image: '🖼️',
      document: '📄',
      folder: '📁',
      lock: '🔒',
      unlock: '🔓',
      eye: '👁️',
      'eye-off': '🙈',
    };
    
    return icons[iconName] || '•';
  };

  return (
    <Text 
      style={[
        { 
          fontSize: size, 
          color, 
          lineHeight: size + 4 
        }, 
        style
      ]}
    >
      {getIcon(name)}
    </Text>
  );
};

// Iconos específicos para cada sección
export const HomeIcon = ({ focused, size, color }) => (
  <Icon name={focused ? 'home' : 'home-outline'} size={size} color={color} />
);

export const RequestIcon = ({ focused, size, color }) => (
  <Icon name={focused ? 'request' : 'request-outline'} size={size} color={color} />
);

export const HistoryIcon = ({ focused, size, color }) => (
  <Icon name={focused ? 'history' : 'history-outline'} size={size} color={color} />
);

export const ProfileIcon = ({ focused, size, color }) => (
  <Icon name={focused ? 'profile' : 'profile-outline'} size={size} color={color} />
);

export const BriefcaseIcon = ({ focused, size, color }) => (
  <Icon name={focused ? 'briefcase' : 'briefcase-outline'} size={size} color={color} />
);

export const CalendarIcon = ({ focused, size, color }) => (
  <Icon name={focused ? 'calendar' : 'calendar-outline'} size={size} color={color} />
);

export const MoneyIcon = ({ focused, size, color }) => (
  <Icon name={focused ? 'money' : 'money-outline'} size={size} color={color} />
);

export const DashboardIcon = ({ focused, size, color }) => (
  <Icon name={focused ? 'dashboard' : 'dashboard-outline'} size={size} color={color} />
);

export const UsersIcon = ({ focused, size, color }) => (
  <Icon name={focused ? 'users' : 'users-outline'} size={size} color={color} />
);

export const ReportsIcon = ({ focused, size, color }) => (
  <Icon name={focused ? 'reports' : 'reports-outline'} size={size} color={color} />
);

export const SettingsIcon = ({ focused, size, color }) => (
  <Icon name={focused ? 'settings' : 'settings-outline'} size={size} color={color} />
);

export default Icon;