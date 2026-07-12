// NOVIGO Backend — Test de charge k6.
//
// Prérequis : k6 (https://k6.io). L'API doit tourner (mode démo suffit) :
//   java -jar target/novigo-api.jar --spring.profiles.active=demo
//
// Lancer :
//   k6 run scripts/load-test.js
//   BASE_URL=http://localhost:8081 k6 run scripts/load-test.js
//   k6 run -e VUS=50 -e DURATION=1m scripts/load-test.js
//
// Scénario : montée en charge sur les endpoints publics (browse) + parcours
// authentifié (login OTP → appel protégé). Seuils = critères d'échec du test.

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8081';
const API = `${BASE_URL}/api/v1`;

const errors = new Rate('business_errors');

export const options = {
  scenarios: {
    ramp: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: __ENV.DURATION || '30s', target: Number(__ENV.VUS) || 20 },
        { duration: '20s', target: Number(__ENV.VUS) || 20 },
        { duration: '10s', target: 0 },
      ],
      gracefulRampDown: '5s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],      // < 1 % d'échecs HTTP
    http_req_duration: ['p(95)<800'],    // p95 < 800 ms
    business_errors: ['rate<0.02'],
  },
};

// Compte semé par DemoSeeder (mode démo) : client@novigo.ml / 123456.
const DEMO_IDENTIFIER = 'client@novigo.ml';
const DEMO_PASSWORD = '123456';

function login() {
  const res = http.post(`${API}/auth/login`,
    JSON.stringify({ identifier: DEMO_IDENTIFIER, password: DEMO_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } });
  if (res.status !== 200) return null;
  try {
    return res.json('accessToken');
  } catch (_) {
    return null;
  }
}

export default function () {
  group('public browse', () => {
    const endpoints = [
      `${API}/categories`,
      `${API}/stores?page=0&size=20`,
      `${API}/products?page=0&size=20&sort=createdAt,desc`,
      `${API}/restaurants`,
      `${API}/providers`,
      `${API}/payments/providers`,
    ];
    endpoints.forEach((url) => {
      const res = http.get(url);
      const ok = check(res, { 'browse 200': (r) => r.status === 200 });
      errors.add(!ok);
    });
  });

  group('authenticated flow', () => {
    const token = login();
    if (!token) {
      errors.add(1);
      return;
    }
    const auth = { headers: { Authorization: `Bearer ${token}` } };
    const me = http.get(`${API}/auth/me`, auth);
    const ok = check(me, { 'me 200': (r) => r.status === 200 });
    errors.add(!ok);
  });

  sleep(1);
}
