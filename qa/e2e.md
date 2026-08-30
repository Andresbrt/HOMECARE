# E2E QA HomeCare

## Objetivo

Documentar la configuración necesaria para pruebas end-to-end (E2E) de la app mobile.

## Estado actual

- El proyecto mobile tiene Jest configurado para unit tests.
- No hay configuración E2E implementada actualmente.

## Herramienta recomendada

Recomiendo usar una de estas herramientas para E2E:
- Detox (React Native / Expo)
- Expo E2E
- Playwright + Appium (más avanzado)

## Opción rápida: Detox

### 1. Instalar

```bash
cd mobile
npm install --save-dev detox detox-cli
```

### 2. Configurar `detox.config.js`

```js
/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: 'jest',
  runnerConfig: 'e2e/config.json',
  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build: 'cd android && ./gradlew assembleDebug assembleAndroidTest -DtestBuildType=debug',
    },
  },
  artifacts: {
    rootDir: 'e2e/artifacts',
  },
};
```

### 3. Configurar `e2e/config.json`

```json
{
  "setupFilesAfterEnv": ["./init.js"],
  "testEnvironment": "node",
  "testTimeout": 120000
}
```

### 4. Añadir test de ejemplo

Crear `mobile/e2e/firstTest.e2e.js` con un simple flujo de login.

### 5. Ejecutar

```bash
cd mobile
npx detox build --configuration android.debug
npx detox test --configuration android.debug
```

## Opción alternativa: Expo E2E

Expo también puede ejecutar tests con `expo-module-scripts` y `@expo/cli`.

## Recomendación inmediata

Para demo y QA inicial, prioriza:
1. Backend: `mvn test` y `mvn jacoco:report`
2. Mobile: `npm test:unit` y `npm test:coverage`
3. Crear un test E2E mínimo de flujo de login y creación de solicitud.

## Nota

El soporte E2E completo requiere que la app esté compilable en Android/iOS y que tengas dispositivos/emuladores configurados. En el corto plazo, el primer valor útil se obtiene con tests unitarios sólidos y un caso de prueba E2E simple.
