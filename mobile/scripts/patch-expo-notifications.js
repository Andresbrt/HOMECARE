const fs = require('fs');
const path = require('path');

// 1. Parchar warnOfExpoGoPushUsage para evitar throw fatal
const warnFiles = [
  path.join(__dirname, '../node_modules/expo-notifications/build/warnOfExpoGoPushUsage.js'),
  path.join(__dirname, '../node_modules/expo-notifications/src/warnOfExpoGoPushUsage.ts'),
];

warnFiles.forEach((file) => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (content.includes("throw new Error(message);")) {
      content = content.replace(
        /if\s*\(\s*Platform\.OS\s*===\s*['"]android['"]\s*\)\s*\{\s*throw new Error\(message\);\s*\}\s*else if\s*\(\s*__DEV__\s*\)\s*\{/g,
        'if (__DEV__) {'
      );
      content = content.replace(/throw new Error\(message\);/g, 'console.warn(message);');
      fs.writeFileSync(file, content, 'utf8');
      console.log(`[patch-expo-notifications] Puesto parche a ${file}`);
    }
  }
});

// 2. Parchar TopicSubscriptionModule.android.js para evitar "Cannot find native module 'ExpoTopicSubscriptionModule'"
const topicFile = path.join(__dirname, '../node_modules/expo-notifications/build/TopicSubscriptionModule.android.js');
if (fs.existsSync(topicFile)) {
  const content = `import { requireOptionalNativeModule } from 'expo-modules-core';
const nativeModule = typeof requireOptionalNativeModule === 'function'
  ? requireOptionalNativeModule('ExpoTopicSubscriptionModule')
  : null;

export default nativeModule || {
  addListener: () => {},
  removeListeners: () => {},
  subscribeToTopicAsync: () => Promise.resolve(null),
  unsubscribeFromTopicAsync: () => Promise.resolve(null),
};
`;
  fs.writeFileSync(topicFile, content, 'utf8');
  console.log(`[patch-expo-notifications] Puesto parche a ${topicFile}`);
}

// 3. Parchar ServerRegistrationModule.native.js
const serverRegFile = path.join(__dirname, '../node_modules/expo-notifications/build/ServerRegistrationModule.native.js');
if (fs.existsSync(serverRegFile)) {
  const content = `import { requireOptionalNativeModule } from 'expo-modules-core';
const nativeModule = typeof requireOptionalNativeModule === 'function'
  ? requireOptionalNativeModule('NotificationsServerRegistrationModule')
  : null;

export default nativeModule || {};
`;
  fs.writeFileSync(serverRegFile, content, 'utf8');
  console.log(`[patch-expo-notifications] Puesto parche a ${serverRegFile}`);
}

// 4. Parchar PushTokenManager.native.js
const pushTokenFile = path.join(__dirname, '../node_modules/expo-notifications/build/PushTokenManager.native.js');
if (fs.existsSync(pushTokenFile)) {
  const content = `import { requireOptionalNativeModule } from 'expo-modules-core';
const nativeModule = typeof requireOptionalNativeModule === 'function'
  ? requireOptionalNativeModule('ExpoPushTokenManager')
  : null;

export default nativeModule || {
  addListener: () => {},
  removeListeners: () => {},
  getDevicePushTokenAsync: () => Promise.resolve(null),
};
`;
  fs.writeFileSync(pushTokenFile, content, 'utf8');
  console.log(`[patch-expo-notifications] Puesto parche a ${pushTokenFile}`);
}
