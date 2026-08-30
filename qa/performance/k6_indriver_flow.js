import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },   // Rampa inicial
    { duration: '3m', target: 200 },  // Carga constante
    { duration: '1m', target: 400 },  // Pico
    { duration: '1m', target: 0 },    // Bajada
  ],
  thresholds: {
    http_req_duration: ['p(95)<400', 'p(99)<800'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8090/api';
const TOKEN = __ENV.TEST_JWT_TOKEN || 'dummy_token';

export default function () {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${TOKEN}`,
  };

  // 1. Cliente consulta solicitudes
  const resMisSolicitudes = http.get(`${BASE_URL}/solicitudes/mis-solicitudes`, { headers });
  check(resMisSolicitudes, {
    'Listar solicitudes status 200/401': (r) => r.status === 200 || r.status === 401,
  });

  sleep(1);

  // 2. Proveedor busca solicitudes cercanas (radio 10 km)
  const resCercanas = http.get(
    `${BASE_URL}/solicitudes/cercanas?lat=4.7110&lng=-74.0721&radioKm=10`,
    { headers }
  );
  check(resCercanas, {
    'Solicitudes cercanas status 200/401': (r) => r.status === 200 || r.status === 401,
    'Latencia Haversine < 400ms': (r) => r.timings.duration < 400,
  });

  sleep(2);
}
