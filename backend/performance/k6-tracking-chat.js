import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },
    { duration: '1m', target: 60 },
    { duration: '30s', target: 0 }
  ],
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<1200']
  }
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8082';
const TOKEN = __ENV.TOKEN || '';
const SOLICITUD_ID = __ENV.SOLICITUD_ID || '1';
const SERVICIO_ID = __ENV.SERVICIO_ID || '1';
const DESTINATARIO_ID = __ENV.DESTINATARIO_ID || '2';
const LAT = Number(__ENV.LAT || 4.711);
const LNG = Number(__ENV.LNG || -74.072);

const headers = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${TOKEN}`
};

export default function () {
  if (!TOKEN) {
    throw new Error('Define TOKEN para ejecutar la prueba: TOKEN=<jwt> k6 run ...');
  }

  const trackingPayload = JSON.stringify({
    servicioId: Number(SERVICIO_ID),
    latitud: LAT + Math.random() * 0.001,
    longitud: LNG + Math.random() * 0.001,
    precisionMetros: 8,
    velocidadKmh: 28,
    timestamp: new Date().toISOString()
  });

  const trackingRes = http.post(`${BASE_URL}/api/location/tracking/update`, trackingPayload, { headers });
  check(trackingRes, {
    'tracking status 2xx': (r) => r.status >= 200 && r.status < 300
  });

  const chatPayload = JSON.stringify({
    solicitudId: Number(SOLICITUD_ID),
    destinatarioId: Number(DESTINATARIO_ID),
    contenido: `k6 ping ${Date.now()}`,
    tipoMensaje: 'TEXTO'
  });

  const chatRes = http.post(`${BASE_URL}/api/mensajes`, chatPayload, { headers });
  check(chatRes, {
    'chat status 2xx': (r) => r.status >= 200 && r.status < 300
  });

  const unreadRes = http.get(`${BASE_URL}/api/mensajes/no-leidos`, { headers });
  check(unreadRes, {
    'unread status 2xx': (r) => r.status >= 200 && r.status < 300
  });

  sleep(1);
}
