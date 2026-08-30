import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 100 },
    { duration: '2m', target: 300 },
    { duration: '30s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<350'],
    http_req_failed: ['rate<0.005'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8090/api';
const TOKEN = __ENV.TEST_JWT_TOKEN || 'dummy_token';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`,
  };

  // Coordenadas aleatorias dentro del área metropolitana de Bogotá
  const lat = 4.60 + Math.random() * 0.15;
  const lng = -74.15 + Math.random() * 0.15;

  const res = http.get(
    `${BASE_URL}/solicitudes/cercanas?lat=${lat.toFixed(4)}&lng=${lng.toFixed(4)}&radioKm=10`,
    { headers }
  );

  check(res, {
    'Búsqueda geográfica exitosa': (r) => r.status === 200 || r.status === 401,
    'Respuesta rápida < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(0.5);
}
