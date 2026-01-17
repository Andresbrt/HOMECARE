const { defaults: tsjPreset } = require('ts-jest/presets');

module.exports = {
  preset: 'react-native',
  rootDir: '..',
  testMatch: ['<rootDir>/e2e/**/*.e2e.js'],
  testTimeout: 120000,
  maxWorkers: 1,
  globalSetup: 'detox/runners/jest/globalSetup',
  globalTeardown: 'detox/runners/jest/globalTeardown',
  reporters: [
    'default',
    ['detox/runners/jest/reporter', {
      verbose: true,
      takeScreenshots: 'failing',
      showDeprecationWarnings: false
    }]
  ],
  testEnvironment: 'detox/runners/jest/testEnvironment',
  verbose: true,
  setupFilesAfterEnv: ['<rootDir>/e2e/setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|react-navigation|@react-native-async-storage|react-native-vector-icons|react-native-maps)/)'
  ]
};