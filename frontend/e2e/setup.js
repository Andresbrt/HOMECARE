const { beforeAll, afterAll } = require('@jest/globals');

beforeAll(async () => {
  // Configuración global antes de todos los tests
  console.log('Setting up E2E test environment...');
  
  // Configurar timeouts
  jest.setTimeout(120000);
  
  // Configurar variables de entorno de test
  process.env.NODE_ENV = 'test';
  process.env.API_BASE_URL = 'http://localhost:8080';
});

afterAll(async () => {
  // Limpieza después de todos los tests
  console.log('Cleaning up E2E test environment...');
});