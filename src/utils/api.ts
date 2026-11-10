import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { BASE_URL } from './apiBase';

export { BASE_URL };

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

export const TOKEN_KEY = 'nbc_access_token';
export const REFRESH_KEY = 'nbc_refresh_token';

type TrackedConfig = InternalAxiosRequestConfig & {
  /** Set once the request has been retried after a 401, so it is never retried twice. */
  _retry?: boolean;
  /** The token pair in storage when the request was sent, to detect a refresh that happened since. */
  _sentAccess?: string | null;
  _sentRefresh?: string | null;
};

const read = (key: string) => (typeof window !== 'undefined' ? localStorage.getItem(key) : null);

// ── Session end ──
// AuthProvider registers its logout() here, so a session the backend rejects ends exactly like
// a sign-out from the UI (blacklist call, tokens and caches cleared, context reset, /login).
let sessionEndedHandler: (() => void) | null = null;

export function setSessionEndedHandler(handler: (() => void) | null) {
  sessionEndedHandler = handler;
}

function endSession() {
  if (sessionEndedHandler) {
    sessionEndedHandler();
    return;
  }
  // No provider mounted (should not happen): at least clear our keys and leave.
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
  window.location.replace('/login');
}

/**
 * Ask the backend to blacklist a refresh token so it can never mint access tokens again.
 * Best effort: resolves when the call settles or after `timeoutMs`, and never throws. A 404
 * (endpoint not deployed yet), a 401 (token already invalid), a network error or a timeout are
 * all fine — the local session is cleared regardless.
 */
export async function blacklistRefreshToken(refresh: string, timeoutMs = 2000): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    // Plain fetch, not `api`: a 401 here must not trigger the refresh interceptor.
    await fetch(`${BASE_URL}/api/token/blacklist/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh }),
      credentials: 'omit',
      signal: controller.signal,
    });
  } catch {
    /* not deployed yet, offline, or timed out */
  } finally {
    clearTimeout(timer);
  }
}

// ── Request Interceptor ──
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const tracked = config as TrackedConfig;
      const token = read(TOKEN_KEY);
      tracked._sentAccess = token;
      tracked._sentRefresh = read(REFRESH_KEY);
      if (token) config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ── Token refresh ──
// The backend rotates refresh tokens and blacklists the old one on every refresh, so the rotated
// refresh token must be stored, and a refresh token must never be sent twice: concurrent 401s in
// this tab share one refresh, and navigator.locks serialises refreshes across tabs (a tab that
// waited re-reads storage and reuses the pair another tab already obtained).

/** The stored session is gone or the backend rejected the refresh token. */
class SessionEndedError extends Error {}

let refreshInFlight: Promise<string> | null = null;

async function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  // The lock is held until fn() settles; other tabs wait their turn.
  if (locks?.request) return await locks.request('nbc-ess-token-refresh', fn);
  return fn();
}

/** The stored access token, if a newer pair than the one holding `refresh` is stored. */
function newerPairStored(refresh: string): string | null {
  const stored = read(REFRESH_KEY);
  const access = read(TOKEN_KEY);
  return stored && stored !== refresh && access ? access : null;
}

async function doRefresh(staleRefresh: string): Promise<string> {
  const current = read(REFRESH_KEY);
  if (!current) throw new SessionEndedError('No refresh token');

  // Another tab (or an earlier refresh in this tab) rotated the pair while we waited for the lock.
  const alreadyRefreshed = newerPairStored(staleRefresh);
  if (alreadyRefreshed) return alreadyRefreshed;

  let data: { access: string; refresh?: string };
  try {
    ({ data } = await axios.post(`${BASE_URL}/api/token/refresh/`, { refresh: current }, { timeout: 15000 }));
  } catch (err) {
    // A browser without navigator.locks may have let another tab rotate the pair meanwhile.
    const rotatedElsewhere = newerPairStored(current);
    if (rotatedElsewhere) return rotatedElsewhere;
    throw err;
  }

  // The session ended while the refresh was in flight (signed out meanwhile). Never write the new
  // pair back into a cleared session: /login would see it and sign the user straight back in.
  // Revoke it instead (best effort) and fail like any ended session.
  if (!read(REFRESH_KEY)) {
    if (data.refresh) void blacklistRefreshToken(data.refresh);
    throw new SessionEndedError('Signed out during refresh');
  }
  localStorage.setItem(TOKEN_KEY, data.access);
  if (data.refresh) localStorage.setItem(REFRESH_KEY, data.refresh);
  return data.access;
}

function refreshAccessToken(staleRefresh: string): Promise<string> {
  if (!refreshInFlight) {
    refreshInFlight = withRefreshLock(() => doRefresh(staleRefresh)).finally(() => {
      refreshInFlight = null;
    });
  }
  return refreshInFlight;
}

/** 400/401/403 from /api/token/refresh/ mean the refresh token is invalid, expired or
 *  blacklisted. Network errors, timeouts and 5xx do not end the session. */
function sessionRejected(err: unknown): boolean {
  if (err instanceof SessionEndedError) return true;
  const status = axios.isAxiosError(err) ? err.response?.status : undefined;
  return status === 400 || status === 401 || status === 403;
}

// ── Response Interceptor (silent refresh) ──
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as TrackedConfig | undefined;
    if (typeof window === 'undefined' || error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      // Already retried (after a refresh, or with a newer stored pair) and refused again, with the
      // access token that is still stored: that token is dead and refreshing cannot fix it, e.g. a
      // refresh token minted before CHECK_REVOKE_TOKEN keeps refreshing into access tokens the API
      // refuses. End the session instead of failing every request from now on. No endpoint
      // answers 401 for anything but authentication (a wrong current password is a 400).
      if (originalRequest._sentAccess && originalRequest._sentAccess === read(TOKEN_KEY)) endSession();
      return Promise.reject(error);
    }
    originalRequest._retry = true;

    const refreshToken = read(REFRESH_KEY);
    if (!refreshToken) {
      endSession();
      return Promise.reject(error);
    }

    // The pair changed after this request went out (a parallel request or another tab refreshed
    // it): the stored access token is newer than the one that failed, so just retry with it.
    const access = read(TOKEN_KEY);
    if (refreshToken !== originalRequest._sentRefresh || (access && access !== originalRequest._sentAccess)) {
      return api(originalRequest);
    }

    try {
      await refreshAccessToken(refreshToken);
      return api(originalRequest); // the request interceptor attaches the new access token
    } catch (refreshError) {
      if (sessionRejected(refreshError)) endSession();
      return Promise.reject(error);
    }
  }
);

export default api;
