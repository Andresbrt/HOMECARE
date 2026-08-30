jest.mock('react-native-gesture-handler', () => require('./__mocks__/react-native-gesture-handler'));

jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

process.env.SUPABASE_URL = 'https://test.supabase.local';
process.env.SUPABASE_ANON_KEY = 'anon-test-key';
process.env.FIREBASE_API_KEY = 'test-firebase-api-key';
process.env.FIREBASE_PROJECT_ID = 'test-firebase-project';
process.env.FIREBASE_APP_ID = '1:test:android:abc123';
process.env.FIREBASE_MESSAGING_SENDER_ID = '1234567890';

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }) => children,
  SafeAreaView: ({ children }) => children,
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  initialWindowMetrics: {
    frame: { x: 0, y: 0, width: 375, height: 812 },
    insets: { top: 0, right: 0, bottom: 0, left: 0 },
  },
  __esModule: true,
}));
