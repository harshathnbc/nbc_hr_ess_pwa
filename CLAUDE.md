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
    login/          — JWT login
    (app)/          — employee self-service, bottom-nav shell
      home/  attendance/  leave/  payslip/  more/
    mgmt/           — manager views, gated on the is_manager JWT claim
      employees/  assets/  settings/
    offline/        — offline fallback page
  components/BottomNav.tsx
  context/AuthContext.tsx
  i18n/             — i18next, locales/en.json + ar.json
  utils/api.ts
public/
  manifest.json  sw.js  icons/
```

## Conventions

**The API base URL is hardcoded** to `https://api.nbcerp.com` in `src/utils/api.ts` — this app does
not use an env var. To point at a local backend you must edit that constant (and remember not to
commit it).

**Token keys are `nbc_access_token` / `nbc_refresh_token`** in `localStorage` — deliberately
different names from the web portal, which uses `nbc_access` / `nbc_refresh`. Don't copy auth code
between the two repos without renaming.

**Manager access is gated on the `is_manager` JWT claim**, not on a route guard alone. The `/mgmt`
section is invisible to ordinary employees.

**Screens intentionally mirror the old React Native app** — the design was aligned deliberately so
employees migrating from the Expo app see the same thing. Check `../nbc_hr_ess_mobile/app/` before
redesigning a screen; a difference is more likely an unfinished port than a decision.

**i18n via i18next** with `en.json` / `ar.json`. Arabic must flip to RTL. Every new string needs
both locales.

**Service worker** is `public/sw.js`, registered by `src/app/sw-register.tsx`. Changing cached
assets requires thinking about upgrade behaviour for already-installed users — a stale SW will keep
serving the old bundle. App icons live in `public/icons/` and have been re-cut several times; keep
them square (192 and 512) with a white background.

**Backend contract**: list endpoints return paginated envelopes — read `res.data.results`, not
`res.data`. Dashboard responses are nested (`headcount.total`, `by_workarea`, `asset_stats`);
match the actual API shape rather than assuming flat fields.

## Note on repo visibility

**This is the one public repo of the four.** It contains no secrets today (only the public
`api.nbcerp.com` URL), but be deliberate about what lands here — no employee data, no internal
hostnames, no credentials. Consider making it private.

## Deploying

**Pushing to `master` deploys to production on Vercel.** Confirm with Harshath before pushing.
