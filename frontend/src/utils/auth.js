import { idbGet, idbSet, idbDel } from './idb';

const DB_NAME = 'agrosens-auth';
const STORE = 'session';
const KEY = 'current';

const API_BASE = import.meta.env.PROD ? window.location.origin : '';

async function request(path, opts = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    credentials: 'include',
    ...opts,
  });
  if (!res.ok) {
    let errText = 'Request failed';
    try { const j = await res.json(); errText = j.error || errText; } catch {}
    throw new Error(errText);
  }
  return res.json();
}

export const auth = {
  async login(email, password) {
    const data = await request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    const session = { token: data.token, user: data.user, cachedAt: Date.now() };
    await idbSet(KEY, session, DB_NAME, STORE);
    sessionStorage.setItem('authToken', data.token);
    return session;
  },
  async logout() {
    try { await request('/api/auth/logout', { method: 'POST' }); } catch {}
    await idbDel(KEY, DB_NAME, STORE);
    sessionStorage.removeItem('authToken');
  },
  async getSession() {
    console.log('[auth.getSession] Iniciando...');
    
    // Check guest mode first
    try {
      const guestData = sessionStorage.getItem('authGuest');
      if (guestData) {
        console.log('[auth.getSession] Sesión de invitado encontrada');
        return JSON.parse(guestData);
      }
    } catch (e) {
      console.warn('[auth.getSession] Error al leer guestData:', e);
    }
    
    const inMemory = sessionStorage.getItem('authToken');
    console.log('[auth.getSession] Token en memoria:', !!inMemory);
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise((resolve) => setTimeout(() => {
      console.log('[auth.getSession] Timeout alcanzado (1s)');
      resolve(null);
    }, 1000));
    
    try {
      const cached = await Promise.race([
        idbGet(KEY, DB_NAME, STORE),
        timeoutPromise
      ]);
      
      console.log('[auth.getSession] Sesión cacheada:', cached);
      
      if (inMemory && cached) return cached;
      if (cached) {
        // Allow offline reuse; token may be expired but enables offline mode
        return cached;
      }
    } catch (e) {
      console.warn('[auth.getSession] IDB read error:', e);
    }
    
    console.log('[auth.getSession] No hay sesión, retornando null');
    return null;
  },
  isOnline() {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  },
  async guestEnter(acknowledged) {
    if (!acknowledged) throw new Error('Debe aceptar la advertencia');
    const session = { token: null, user: { nombre: 'Invitado', email: null, rol: 'invitado', exp: null }, guest: true, cachedAt: Date.now() };
    // Guardar solo en memoria de sesión, no persistente a largo plazo
    try { sessionStorage.setItem('guestSession', '1'); } catch {}
    try { sessionStorage.setItem('authGuest', JSON.stringify(session)); } catch {}
    try { await idbDel(KEY, DB_NAME, STORE); } catch { /* ignorar errores de IDB en modo invitado */ }
    return session;
  },
  async clearGuestOnRestart() {
    if (!sessionStorage.getItem('guestSession')) {
      await idbDel(KEY, DB_NAME, STORE);
    }
  }
};
