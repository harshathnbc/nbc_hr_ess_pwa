// The Django API this app talks to. A constant by design (this app has no env var for it).
//
// It lives in a module without imports so that src/utils/api.ts, the login page and
// next.config.ts (for the Content-Security-Policy) all share this one value. To point a local
// build at another backend, change it here — and don't commit that change.
export const BASE_URL = 'https://api.nbcerp.com';
