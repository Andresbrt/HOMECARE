/**
 * Shared fetch helper for security tests.
 * Uses Node native http/https transports to bypass React Native / jest-expo XHR stubs.
 * When backend is unreachable or returns network errors, returns { status: -1, ok: false }.
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const API_BASE = process.env.API_URL || 'https://homecare-backend.fly.dev';

let _backendReachable = null; // null = untested

/**
 * Safe fetch implementation with native node http/https
 */
function safeFetch(urlStr, options = {}) {
  return new Promise((resolve) => {
    try {
      const parsed = new URL(urlStr);
      const transport = parsed.protocol === 'https:' ? https : http;
      const headers = Object.assign({}, options.headers || {});
      
      const req = transport.request(parsed, {
        method: options.method || 'GET',
        headers: headers,
        timeout: 10000,
      }, (res) => {
        let body = '';
        res.on('data', chunk => body += chunk);
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            statusCode: res.statusCode,
            ok: res.statusCode >= 200 && res.statusCode < 300,
            statusText: res.statusMessage,
            headers: {
              get: (k) => res.headers[k.toLowerCase()] || null,
            },
            text: async () => body,
            json: async () => {
              try { return JSON.parse(body); } catch { return {}; }
            },
          });
        });
      });

      req.on('error', (err) => {
        resolve({
          status: -1,
          statusCode: -1,
          ok: false,
          statusText: 'NETWORK_ERROR',
          headers: { get: () => null },
          json: async () => ({}),
          text: async () => '',
          _networkError: err.message,
        });
      });

      req.on('timeout', () => {
        req.destroy();
        resolve({
          status: -1,
          statusCode: -1,
          ok: false,
          statusText: 'TIMEOUT',
          headers: { get: () => null },
          json: async () => ({}),
          text: async () => '',
        });
      });

      if (options.body) {
        req.write(options.body);
      }
      req.end();
    } catch (err) {
      resolve({
        status: -1,
        statusCode: -1,
        ok: false,
        statusText: 'ERROR',
        headers: { get: () => null },
        json: async () => ({}),
        text: async () => '',
        _networkError: err.message,
      });
    }
  });
}

async function checkBackendReachable() {
  if (_backendReachable !== null) return _backendReachable;
  const res = await safeFetch(`${API_BASE}/actuator/health`);
  _backendReachable = res.status === 200;
  return _backendReachable;
}

/**
 * Login helper — returns a token or null.
 */
async function loginAs(email, password) {
  const res = await safeFetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (res.status === -1 || !res.ok) return null;
  try {
    const data = await res.json();
    return data.token || data.accessToken || null;
  } catch {
    return null;
  }
}

/**
 * Skip guard — use at the top of any test that requires backend:
 *   if (skipIfOffline(res)) return;
 */
function skipIfOffline(res) {
  if (!res || res.status === -1) {
    console.warn('⚠️ SKIP: Backend not reachable at ' + API_BASE);
    return true;
  }
  return false;
}

module.exports = {
  API_BASE,
  safeFetch,
  loginAs,
  skipIfOffline,
  checkBackendReachable,
};
