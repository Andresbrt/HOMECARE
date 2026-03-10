const { getDefaultConfig } = require('expo/metro-config');

/**
 * Metro configuration para Expo SDK 55 + React Native 0.84 + New Architecture
 * https://docs.expo.dev/guides/customizing-metro/
 *
 * @type {import('expo/metro-config').MetroConfig}
 */
const config = getDefaultConfig(__dirname);

// Optimizaciones para New Architecture y Hermes
config.transformer = {
  ...config.transformer,
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
  // Habilitar soporte para minificación mejorada
  minifierConfig: {
    keep_classnames: true, // Importante para New Architecture
    keep_fnames: true,
    mangle: {
      keep_classnames: true,
      keep_fnames: true,
    },
  },
};

// Añadir extensiones adicionales si es necesario
config.resolver.assetExts.push(
  'bin',
  'txt',
  'json'
);

module.exports = config;