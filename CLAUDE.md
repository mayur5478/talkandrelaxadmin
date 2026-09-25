# CLAUDE.md

Talk and Relax admin panel (`mayur5478/talkandrelaxadmin`): the operator UI for the Talk and Relax product family. Admins and HR sign in to manage users, listeners, wallets, payouts, recharges, monitoring, support, and campaigns. Sibling repos (not in this tree): `mayur5478/talkandrelaxmobileapp` (Flutter), `mayur5478/talkandrelaxwebsite`, `mayur5478/talkandrelaxbackend`. This app talks to that backend through `REACT_APP_SERVER_URL` (REST paths such as `admin/login` and `user/user-list`). A separate agent service is called from `src/services/agent.js`. The same build also serves the public listener apply/onboarding flow.

## Stack

Create React App (`react-scripts` 5.0.1), React 18.3.1, JavaScript only (no TypeScript). Versions below are from `package-lock.json`.

- Routing: `react-router-dom` 7.9.3
- Data: `@reduxjs/toolkit` 2.9.0 and `react-redux` 9.2.0. RTK Query only; there are no hand-written slices.
- UI: Bootstrap 5.3.8 and `react-bootstrap` 2.10.10, plus Tailwind CSS 3.4.19 (`tw-` prefix, preflight off) with `tailwind-merge`, `clsx`, and `class-variance-authority` 0.7.1
- Icons: `lucide-react` 1.14.0 in the shell. Older pages use PNGs in `src/components/assets` and Font Awesome from the CDN in `public/index.html`
- Realtime: `socket.io-client` 4.8.3 (support tickets only)
- Also in use: `jwt-decode` 4.0.0, `sass` 1.93.2, `sweetalert2` 11.24.1, `moment` 2.30.1, `flatpickr` / `react-flatpickr`, `apexcharts` 4.7.0 and `recharts` 3.8.1, `exceljs` 4.4.0 + `file-saver`, `cmdk` 1.1.1, `framer-motion` 12.38.0, `react-h5-audio-player`, `react-player`

## Commands

Checked with Node 22 and `npm ci` from `package-lock.json`.

| Command | What happens |
| --- | --- |
| `npm ci` | Installs the lockfile. Works. |
| `npm start` | Dev server. The script is `set PORT=3001 && react-scripts start` (Windows `cmd`). In bash/zsh `set` does not assign `PORT`, so CRA binds port 3000. README's `http://localhost:3000` matches Unix. For port 3001 on Unix: `PORT=3001 npx react-scripts start`. |
| `npm run build` | `CI=false react-scripts build`. Succeeds and writes gitignored `build/`. ESLint warnings print and do not fail the build, because the script forces `CI=false`. |
| lint | No `lint` script. ESLint (`react-app` and `react-app/jest` in `package.json`) runs inside start and build. |
| typecheck | None. No `tsconfig`. |
| `npm test` | `react-scripts test`. Fails before any assertion. `src/setupTests.js` imports `@testing-library/jest-dom`, which is not in `package.json` or `node_modules`. The only test, `src/App.test.js`, is leftover CRA boilerplate that looks for the text "learn react". |

Do not run `npm run eject`.

## Directory map

- `src/index.js` — Redux `Provider`, Bootstrap and Flatpickr CSS, mounts `App`
- `src/App.js` — top-level router (login, public apply, or onboard-only host)
- `src/components/main/Main.jsx` — authenticated route table; each page is a lazy chunk
- `src/shell/` — live chrome: `AppShell`, `Sidebar`, `Topbar`, `CommandMenu`, `ThemeProvider`, `nav-config.jsx`
- `src/components/v2/ui/` — newer kit (Button, Table, Modal, toast, …). Import from the `index.js` barrel
- `src/components/v2/listener-management/` — current application-request and profile-approval pages
- `src/components/<feature>/` — one folder per screen, usually a `.jsx` plus co-located `.scss`
- `src/components/common/` — shared modals (wallet, salary, force-end session, export, …)
- `src/services/` — one RTK Query `createApi` per area
- `src/store/store.js` — every API reducer and middleware must be registered here
- `src/routes/ProtectedRoute.js`, `src/routes/RoleRoute.js` — auth and HR path gate
- `src/utils/roles.js` — `admin` vs `hr` path lists (UI mirror of the backend)
- `src/utils/checkToken.js` — JWT `exp` check
- `src/cookie_helper/cookie.js` — `token` and `role` cookies
- `src/styles/tokens.css`, `src/index.css` — CSS variables. Tailwind colors read these
- `src/lib/cn.js` — `twMerge(clsx(...))`
- `public/` — CRA static files. `vercel.json` and `_redirects` both rewrite every path to `index.html`
- `docs/superpowers/plans/` — a past implementation note, not loaded at runtime

`src/components/sidebar/` and `src/components/navbars/` are the previous chrome. `App.js` and `Main.jsx` do not import them. Change the menu in `src/shell/nav-config.jsx`.

## Architecture

**Routing.** `BrowserRouter` in `src/App.js`.

- If `window.location.hostname` equals `REACT_APP_ONBOARD_HOST` (code default `join.talkandrelax.com`), only `/apply` and `/onboarding/:token` exist. Any other path redirects to `/apply`, so the admin login is not on that host.
- Otherwise `/` is the login page. `/apply` and `/onboarding/:token` stay public (listener self-serve, including WorkIndia `?src=` links). `/dashboard/*` sits inside `ProtectedRoute` then `RoleRoute`. `Main` renders `AppShell` and the page routes.
- A new screen needs a lazy import and `<Route>` in `Main.jsx`, a matching full `/dashboard/...` path in `nav-config.jsx`, and an entry in `HR_ALLOWED_PREFIXES` when HR should open it.
- Two routes in `Main.jsx` are written without a leading slash: `user-management/profile-view` and `listener-management/profile-form`.
- `/dashboard/legacy/listener-management/...` still mounts the old application-request and profile-approval components. The sidebar points at the v2 pages.

**Data.** Each `src/services/*.js` file is an RTK Query API using `fetchBaseQuery` and `Authorization: Bearer` from the `token` cookie. Hooks are the generated `useXxxQuery` / `useXxxMutation`. A new file does nothing until both its reducer and its middleware are added in `src/store/store.js`. Some slices use `tagTypes` (`user`, push history); many do not. Support uses `src/components/support-management/useSupportSocket.js`: Socket.IO connects to the origin of `REACT_APP_SERVER_URL` after `/api/v2` is stripped, and events invalidate RTK tags.

**Auth.** Login is `POST admin/login` (`useLoginMutation` in `src/services/auth.js`). `Login.jsx` stores the JWT in the `token` cookie (1 day) and in `localStorage`, and stores `response.admin.role` the same way. `ProtectedRoute` accepts either store and sends expired tokens back to `/`. Most service headers read the cookie only. `src/services/agent.js` also falls back to `localStorage`. `getRole()` in `src/utils/roles.js` reads `localStorage` and treats a missing role as `admin`. Known roles are `admin` and `hr`. HR may open listener management, a few user/profile paths, business insights, status, monitoring, and call rejections (`HR_ALLOWED_PREFIXES` / `HR_DENIED_PREFIXES`). `RoleRoute` only hides URLs. The comment in `roles.js` points at backend `middlewares/auth/secure.js`: a route allowed here still 403s unless that backend allows `hr`.

**Env var names.** CRA inlines every `REACT_APP_*` into the client bundle. Names only:

- `REACT_APP_SERVER_URL` — REST base for every service except the agent. Support sockets and onboarding assume it ends with `/api/v2`. No code fallback on the main slices.
- `REACT_APP_AGENT_URL` — optional override for brief, audit, and chat. If unset, `src/services/agent.js` uses its own fallback (same API host, `/agent` path; the file comment cites local port 3010). Chat is SSE via `streamAgentChat` (`fetch`), not RTK Query.
- `REACT_APP_ONBOARD_HOST` — optional hostname that locks the app to the public apply flow.

`.gitignore` ignores `.env.local` and `.env*.local`. It does not ignore `.env`.

## Conventions

- Function components and default exports. Older screens pair PascalCase components with co-located SCSS.
- New shell UI imports `src/components/v2/ui` by relative path and uses `tw-` classes. The barrel comment shows `@/components/v2/ui`; there is no `jsconfig` paths map, so `@/` does not resolve.
- Tailwind must stay prefixed and with preflight off, or it collides with Bootstrap. `darkMode` is `class`. `ThemeProvider` defaults to dark, toggles `dark` on `<html>`, and persists `tar-admin-theme`.
- Shell and `v2/ui` use single quotes. Older services and pages use double quotes. Match the file you edit.
- These spellings are part of paths and URLs: `coupen`, `commision`, `SalaryPyout`, `contact-quires`, `Gst-list`, `ListenerBLock`. Renaming a file or segment means updating `Main.jsx` and `nav-config.jsx` together.
- Older confirms use SweetAlert2. The shell toasts come from `src/components/v2/ui/toast`.
- Two notification clients: `src/services/notification.js` (push / WhatsApp / SMS, multipart) and `src/services/notifications.js` (`POST /admin/notifications/send` for the listener notification center).

## Gotchas

- This repo is public. `REACT_APP_*` values end up in the JS bundle. Keep secrets out of `src/` and out of committed `.env`. The login success path in `src/services/auth.js` `console.log`s the JWT.
- `.env` is tracked. It currently sets `REACT_APP_SERVER_URL` only (commented alternate hosts sit above it). Local overrides belong in `.env.local`.
- `npm test` is red on a clean install. That failure is the missing Jest DOM package, not a product regression.
- `npm run build` is written to pass while ESLint still reports many `no-unused-vars` and hooks warnings.
- Skipping the `store.js` registration throws when a new hook runs.
- HR path lists are not authorization.
- After the 1-day cookie expires, `ProtectedRoute` can still allow a `localStorage` token, while API calls that read only the cookie go out with no `Authorization` header.
- `package.json` `homepage` is `http://talkandrelax.com`. `npm run build` still emits assets for host root `/`.
- Do not edit `build/`. The lockfile to update is `package-lock.json`. `##package-lock.json` is a second tracked lockfile-shaped file; leave it alone unless you mean to.
- `AGENT_SPEC.md` and `CLAUDE_CODE_PROMPT.md` describe a Next.js, TypeScript, Supabase agent. This repo is CRA, JavaScript, and RTK Query. The agent UI that actually ships is `src/components/agent/`.

## How to work in this repo

1. Locate the screen in `src/shell/nav-config.jsx`, then the `<Route>` in `src/components/main/Main.jsx`.
2. Change data in the matching `src/services/*.js` file. A new API copies `prepareHeaders` from `src/services/user.js` and is registered in `src/store/store.js`.
3. New shell UI uses `src/components/v2/ui` and `tw-` classes. Leave a Bootstrap/SCSS page on that stack unless the task is a migration.
4. An HR-visible page updates `src/utils/roles.js`, and the PR notes that the backend route must allow `hr` or the page will 403.
5. Treat `npm run build` as the compile check. `npm test` does not run until the Jest setup dependency exists.
6. Ignore `AGENT_SPEC.md` when deciding how this app is structured.
