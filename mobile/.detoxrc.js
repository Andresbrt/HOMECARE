/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: {
      $0: 'jest',
      config: 'e2e/jest.config.js',
    },
    jest: {
      setupTimeout: 120000,
    },
  },

  apps: {
    // ── iOS ──────────────────────────────────────────────────────────────────
    'ios.debug': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Debug-iphonesimulator/homecare.app',
      build:
        'xcodebuild -workspace ios/homecare.xcworkspace -scheme homecare ' +
        '-configuration Debug -sdk iphonesimulator ' +
        '-derivedDataPath ios/build',
    },
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/homecare.app',
      build:
        'xcodebuild -workspace ios/homecare.xcworkspace -scheme homecare ' +
        '-configuration Release -sdk iphonesimulator ' +
        '-derivedDataPath ios/build',
    },

    // ── Android ──────────────────────────────────────────────────────────────
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
      reversePorts: [8080],
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      build: 'cd android && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release',
      reversePorts: [8080],
    },
  },

  devices: {
    // ── iOS Simulators ────────────────────────────────────────────────────────
    'simulator': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro',
        os: 'iOS 18.0',
      },
    },
    'simulator.se': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone SE (3rd generation)',
        os: 'iOS 18.0',
      },
    },
    'simulator.max': {
      type: 'ios.simulator',
      device: {
        type: 'iPhone 15 Pro Max',
        os: 'iOS 18.0',
      },
    },

    // ── Android Emulators ─────────────────────────────────────────────────────
    'emulator': {
      type: 'android.emulator',
      device: { avdName: 'Pixel_7_API_34' },
    },
    'emulator.small': {
      type: 'android.emulator',
      device: { avdName: 'Pixel_4_API_34' },
    },
  },

  configurations: {
    // ── Configuraciones principales ───────────────────────────────────────────
    'ios.sim.debug': {
      device: 'simulator',
      app: 'ios.debug',
    },
    'ios.sim.release': {
      device: 'simulator',
      app: 'ios.release',
    },
    'ios.se.debug': {
      device: 'simulator.se',
      app: 'ios.debug',
    },
    'ios.max.debug': {
      device: 'simulator.max',
      app: 'ios.debug',
    },
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
    'android.emu.release': {
      device: 'emulator',
      app: 'android.release',
    },
  },
};
