@AGENTS.md

# NBC ESS PWA — Employee Self-Service (current mobile app)

Next.js 16 (App Router) + React 19 + TypeScript, installable as a PWA. This is the **current** ESS
app for employees on their phones. It replaced the Expo/React Native app in `../nbc_hr_ess_mobile`,
which is now legacy — build new ESS features here.

Deployed on Vercel. Default branch is **`master`**, not `main`.

## Local development

```bash
npm run dev
```

## Layout

```
src/
  app/
    page.tsx        — entry redirect: token + is_manager/is_superuser → /mgmt, else /home, else /login
    providers.tsx   — AuthProvider + i18n side-effect import
    sw-register.tsx — registers /sw.js
    login/          — JWT login
    (app)/          — employee self-service, bottom-nav shell; layout redirects to /login without a token
      home/  attendance/  leave/  payslip/  more/
    mgmt/           — manager views; page.tsx is the manager dashboard
      employees/  assets/  settings/
    offline/        — offline fallback page
  components/BottomNav.tsx
  context/AuthContext.tsx
  i18n/             — i18next, locales/en.json + ar.json
  utils/            — api.ts (axios + refresh), apiBase.ts (API URL constant), logError.ts
public/
  manifest.json  sw.js  icons/
```

Every page is a client component. There are no `loading.tsx`, `error.tsx`, or `not-found.tsx`
files and no tests.

## Conventions

**The API base URL is a constant**, `https://api.nbcerp.com`, in `src/utils/apiBase.ts` — this app
does not use an env var. `api.ts`, the login page and `next.config.ts` (for the CSP) all import it,
so to point at a local backend you edit that one line (and remember not to commit it).

**Token keys are `nbc_access_token` / `nbc_refresh_token`** in `localStorage` — deliberately
different names from the web portal, which uses `nbc_access` / `nbc_refresh`. Don't copy auth code
between the two repos without renaming. The refresh interceptor stores the rotated refresh token,
runs one refresh at a time (shared promise in a tab, `navigator.locks` across tabs), and ends the
session on a 400/401/403 from the refresh endpoint, or when a request retried after a refresh is
refused again with the stored token. A refresh that completes after sign-out is revoked, never
stored. The change-password response carries a fresh token pair, which More stores through
`login()`. **`AuthContext.logout()` is the only
sign-out path** (More, Settings, and a rejected refresh via `setSessionEndedHandler`): it
blacklists the refresh token (`POST /api/token/blacklist/`, best effort, 2 s cap), clears the
tokens, resets the context, deletes every Cache Storage cache and reloads `/login`.
The JWT is decoded with `atob` and its `exp` is never checked client-side, so an expired token
shows the shell until the first 401. Log failures with `utils/logError.ts`, never the raw error:
axios errors carry the `Authorization` header.

**Security headers and the CSP are set in `next.config.ts`.** Scripts, styles and fonts are
`'self'` only (Inter is self-hosted through `next/font` in `layout.tsx`, exposed as
`--font-inter`); network and image requests are `'self'` plus the API origin. Anything loaded from
another origin must be added there.

**Manager access is gated in `src/app/mgmt/layout.tsx`** (since 2026-09-10): no token → `/login`,
token without `is_manager` / `is_superuser` → `/home`, otherwise the shell renders. The same
claim check drives the `/mgmt` link in `BottomNav` and `more/`, and the root redirect in
`page.tsx`. Keep the four in step. As everywhere in this app, the client-side check is a
convenience — the backend re-checks every request.

**Screens intentionally mirror the old React Native app** — the design was aligned deliberately so
employees migrating from the Expo app see the same thing. Check `../nbc_hr_ess_mobile/app/` before
redesigning a screen; a difference is more likely an unfinished port than a decision.

**i18n via i18next** with `en.json` / `ar.json` (browser language detector, cached in
`localStorage`). Every new string needs both locales. As of 2026-09-10, `en.json` has three
`dashboard.*` keys (`leaveStats`, `pendingLeaves`, `approvedThisMonth`) that `ar.json` lacks; none
are referenced by `t()` yet.

**RTL is not implemented.** Arabic should flip the layout, but today `<html lang="en">` is
hardcoded in `layout.tsx` with no `dir`, nothing sets `document.documentElement.dir` on language
change, and the `[dir="rtl"]` rule in `globals.css` is dead. Switching language changes strings
only. The legacy mobile app's `utils/LanguageContext.js` shows the intended behaviour.

**Service worker** is `public/sw.js`, registered by `src/app/sw-register.tsx`. Cache name is
`nbc-ess-v3`. Cache-first applies only to same-origin `/_next/static/`, `/icons/`, `/manifest.json`
and `/offline`; everything else (HTML, RSC payloads, API, media, other origins) is network-only and
never stored. Navigations go to the network and fall back to the cached `/offline`. Activate
deletes every other cache, then `clients.claim()`; `next.config.ts` serves `/sw.js` with
`no-cache` so updates reach installed apps. Bumping `CACHE_NAME` is the only invalidation lever, and
`sw-register.tsx` never prompts the user to reload. Changing cached assets requires thinking about
upgrade behaviour for already-installed users — a stale SW will keep serving the old bundle. App
icons live in `public/icons/` and have been re-cut several times; keep them square (192 and 512)
with a white background. `public/` still holds the stock create-next-app SVGs; they are unused.

**Backend contract**: list endpoints return paginated envelopes — read `res.data.results`, not
`res.data`. Dashboard responses are nested (`headcount.total`, `by_workarea`, `asset_stats`);
match the actual API shape rather than assuming flat fields.

## Note on repo visibility

**This is the one public repo of the four.** It contains no secrets today (only the public
`api.nbcerp.com` URL), but be deliberate about what lands here — no employee data, no internal
hostnames, no credentials. Consider making it private.

## Deploying

**Pushing to `master` deploys to production on Vercel.** Confirm with Harshath before pushing.
