// Log a failure without leaking credentials or personal data. Use instead of console.warn(err).
//
// A raw axios error carries the request config, including the `Authorization: Bearer …` header,
// and usually the response body (employee data). This logs only the HTTP status and the error
// message, and nothing at all in production builds.

import axios from 'axios';

export function logError(err: unknown, context?: string): void {
  if (process.env.NODE_ENV === 'production') return;
  const status = axios.isAxiosError(err) ? err.response?.status : undefined;
  const message =
    err instanceof Error ? err.message : typeof err === 'string' ? err : 'Unknown error';
  console.warn(`[${context ?? 'error'}]`, status ?? '', message);
}
