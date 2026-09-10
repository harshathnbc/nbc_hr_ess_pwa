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
  utils/api.ts
public/
  manifest.json  sw.js  icons/
```

Every page is a client component. There are no `loading.tsx`, `error.tsx`, or `not-found.tsx`
files and no tests.

## Conventions

**The API base URL is hardcoded** to `https://api.nbcerp.com` in `src/utils/api.ts` — this app does
not use an env var. To point at a local backend you must edit that constant (and remember not to
commit it). **`src/app/login/page.tsx` re-hardcodes the same URL** with a bare `axios.post` to
`/api/token/`, so editing only `api.ts` still logs you in against production. Change both, or
better, make login import `BASE_URL` from `api.ts`.

**Token keys are `nbc_access_token` / `nbc_refresh_token`** in `localStorage` — deliberately
different names from the web portal, which uses `nbc_access` / `nbc_refresh`. Don't copy auth code
between the two repos without renaming. The refresh interceptor stores only the new `access`
token and discards the rotated `refresh` token the backend returns; with rotation + blacklist
enabled server-side, that means the second refresh in a session can fail and log the user out.
The JWT is decoded with `atob` and its `exp` is never checked client-side, so an expired token
shows the shell until the first 401.

**Manager access is hidden, not guarded.** `is_manager` / `is_superuser` from the decoded JWT
control whether the `/mgmt` link appears in `BottomNav` and `more/`, and the root redirect. But
`src/app/mgmt/layout.tsx` checks neither a token nor the claim — unlike `(app)/layout.tsx` — so
anyone can load `/mgmt*` and only the API's 401 stops data appearing. Add the guard before
building more manager screens; treat it as the top open item in this repo.

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
`nbc-ess-v2`; strategy is network-first for navigations (falling back to `/offline`), bypass for
anything containing `/api/`, cache-first for everything else, with `skipWaiting()` +
`clients.claim()` on activate. Bumping `CACHE_NAME` is the only invalidation lever, and
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
