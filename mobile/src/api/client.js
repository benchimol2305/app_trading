import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

// URL del backend público (Render). Se actualiza tras desplegar.
const PROD_API_URL = 'https://trading-backend.onrender.com/api';

function resolveHost() {
  const raw =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    Constants.manifest2?.extra?.expoGo?.debuggerHost ||
    Constants.manifest?.debuggerHost ||
    '';
  if (raw) return raw.split(':')[0];
  return 'localhost';
}

export const BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || PROD_API_URL || `http://${resolveHost()}:4000/api`;

export const TOKEN_KEY = 'trading_token';

// Holgado a propósito: el servidor gratuito se "duerme" y tarda hasta ~60s en despertar
const TIMEOUT = 60000;

async function doRequest(path, { method = 'GET', body } = {}) {
  const token = await AsyncStorage.getItem(TOKEN_KEY);

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    const json = await res.json().catch(() => ({
      success: false,
      message: 'Respuesta no válida del servidor',
    }));

    if (!res.ok) {
      const error = new Error(json.message || 'Ocurrió un error en la petición');
      error.status = res.status;
      throw error;
    }
    return json;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Reintenta una vez cuando falla por red o por timeout
 * (el primer intento despierta el servidor dormido).
 */
async function requestRaw(path, options) {
  try {
    return await doRequest(path, options);
  } catch (err) {
    const retryable = !err.status || err.name === 'AbortError';
    if (retryable) {
      try {
        return await doRequest(path, options);
      } catch (second) {
        throw new Error(
          `No se pudo conectar con el servidor. Revisa tu conexión a internet e inténtalo de nuevo.`
        );
      }
    }
    throw err;
  }
}

/** Devuelve solo el contenido de `data` (lo habitual). */
async function request(path, options) {
  const json = await requestRaw(path, options);
  return json ? json.data : null;
}

export const api = {
  get: (path) => request(path),
  /** Devuelve la respuesta completa (data + extras como `totals`). */
  getRaw: (path) => requestRaw(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
};
