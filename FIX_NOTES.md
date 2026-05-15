# Fix for "Application error: a client-side exception has occurred"

## What this fixes

The white-screen "Application error: a client-side exception has occurred"
that appeared after OTP login on the dashboard, especially for users
outside Nigeria.

This is the **full project**, with every fix already applied. Drop it in
place of your existing project, run `npm install`, and deploy.

---

## Root cause (in order of impact)

### 1. No error boundary anywhere in the app

The literal string "Application error: a client-side exception has
occurred" is Next.js 14's built-in production fallback that fires
whenever a client-side error has no `error.tsx` to catch it. Your real
error was being hidden by this generic UI.

### 2. Session-cookie commit race on every auth flow

After every successful auth API call (login OTP, signup, admin-login,
password reset), the response sets a session cookie via `Set-Cookie`,
and the client immediately ran:

```js
router.push("/dashboard");
router.refresh();
```

That pair is a *soft* RSC navigation: Next requests the server payload
for /dashboard. On networks far from your Vercel edge region (your
"outside Nigeria" symptom), or with strict cookie policies (Safari ITP,
some Android WebViews), the RSC request can leave the browser before
the cookie has been committed to the cookie jar.

When that happens:
1. Server renders /dashboard layout, calls `getCurrentUser()`
2. No cookie present → `redirect("/login")` from a server component
3. Mid-soft-navigation `NEXT_REDIRECT` throws on the client
4. No error boundary → "Application error" white screen

The fix: hard navigation via `window.location.assign(target)` so the
browser issues a fresh top-level request *after* committing the cookie.

This race affected **four flows**: `/login/verify`, `/signup`,
`/admin-login`, and `/forgot-password/reset`. All four are fixed.

### 3. `railLabel(r)` crashed on null

In `dashboard/page.tsx` and `dashboard/receipt/[ref]/page.tsx`,
`railLabel(r)` ended with `return r.toUpperCase()` — no null guard.
The first time a pending transfer with null rail rendered, the
dashboard would white-screen. Now matches the transactions page's
safer version.

### 4. Server-only types pulled into client bundle

`DashTopbar.tsx` (client component) did:
```js
import type { SessionUser } from "@/lib/auth";
```

`lib/auth.ts` imports `next/headers`, `bcryptjs`, `jsonwebtoken` —
all server-only. `import type` *should* be erased by the TS compiler,
but with `"moduleResolution": "bundler"` it occasionally leaks the
module reference into the client bundle and crashes hydration.

Fixed by extracting the type to a pure-type module:
`src/lib/auth-types.ts`. `lib/auth.ts` re-exports it so existing
server-side imports keep working.

### 5. Uncaught fetch failures in the dashboard

Dashboard's `load()` had `try { Promise.all([...]) } finally {
setLoading(false); }` — no `catch`. A failed `/api/auth/me` (which
happens if the cookie race occurs on a *subsequent* request) became
an unhandled promise rejection that surfaced through the error
boundary.

Each fetch is now wrapped in `.catch(() => ({ ok: false }))` so
failures degrade gracefully into an inline error banner instead of
blanking the page.

### 6. Layout queries threw on transient Supabase blips

`dashboard/layout.tsx` and `pending-review/page.tsx` assumed their
extra `.single()` query always succeeded. If Supabase had a transient
error, the layout would throw and the page would blank. Both now
wrap that query in try/catch.

---

## Files changed

### New files
- `src/app/error.tsx` — app-level error boundary
- `src/app/global-error.tsx` — last-resort boundary for root-layout errors
- `src/app/dashboard/error.tsx` — dashboard-scoped boundary
- `src/lib/auth-types.ts` — pure type module

### Modified files
- `src/lib/auth.ts` — re-exports `SessionUser` from `auth-types.ts`
- `src/components/dashboard/DashTopbar.tsx` — imports type from
  `auth-types`, logout uses hard nav, guarded `hue()` for missing IDs
- `src/app/(auth)/login/page.tsx` — defensive sessionStorage + JSON
  parsing
- `src/app/(auth)/login/verify/page.tsx` — **hard navigation after OTP**,
  defensive sessionStorage + JSON parsing
- `src/app/(auth)/signup/page.tsx` — **hard navigation after signup**,
  defensive JSON parsing
- `src/app/(auth)/admin-login/page.tsx` — **hard navigation after admin
  login**, defensive JSON parsing
- `src/app/(auth)/forgot-password/page.tsx` — defensive sessionStorage
- `src/app/(auth)/forgot-password/verify/page.tsx` — defensive
  sessionStorage
- `src/app/(auth)/forgot-password/reset/page.tsx` — **hard navigation
  after reset**, defensive sessionStorage + JSON parsing
- `src/app/dashboard/layout.tsx` — `force-dynamic`, tolerant secondary
  query
- `src/app/dashboard/page.tsx` — null-safe `railLabel`, caught fetches,
  NaN-safe helpers, inline error banner
- `src/app/dashboard/receipt/[ref]/page.tsx` — null-safe `railLabel`,
  caught fetch, safe `window.print()`
- `src/app/pending-review/page.tsx` — `force-dynamic`, tolerant query
- `src/app/admin/layout.tsx` — `force-dynamic`

---

## Verification

- `npx tsc --noEmit` — passes with zero errors
- `npx next build` — completes successfully, all routes compile

## How to deploy

```bash
# At your project root:
unzip crest-full.zip          # creates n26-clone/ with all fixes baked in
cd n26-clone
npm install
# Set your real env vars (SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, JWT_SECRET, ...)
npm run build                  # optional, just to sanity-check locally
git add -A && git commit -m "fix: client-side exception after OTP login"
git push                       # Vercel deploys automatically
```

No schema changes, no env var additions, no package changes.

## How to verify after deploy

1. Hit the site via VPN from a region distant from your Vercel edge
   (Tokyo, São Paulo, Sydney work well).
2. Open Chrome → DevTools → Network → enable "Slow 3G" throttling.
3. Sign in → enter OTP → you should land on /dashboard cleanly.
4. If anything still breaks, the new error boundary will display the
   real digest. Search the Vercel function logs for that digest to
   get the actual stack trace.
