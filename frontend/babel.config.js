module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        '@react-native/babel-preset',
        {
          unstable_transformProfile: 'hermes-stable',
        },
      ],
    ],
    plugins: [
      // Expo Router requiere este plugin
      'expo-router/babel',
      // React Native Reanimated plugin DEBE ser el último
      'react-native-reanimated/plugin',
    ],
    env: {
      production: {
        plugins: ['transform-remove-console'],
      },
    },
  };
};
