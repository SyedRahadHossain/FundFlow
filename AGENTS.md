# FundFlow — Agent Instructions

## Repository Structure

```
fundflow-complete/
├── client/          # Next.js 16 (App Router) + Tailwind CSS
└── server/          # Express + MongoDB REST API
```

Two independent packages. Each has its own `package.json`, `node_modules`, and environment files.

---

## Common Commands

### Server (run from `server/`)

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start with nodemon on `http://localhost:5000` |
| `npm start` | Production start (`node index.js`) |
| `npm test` | Run 171 tests (Jest + Supertest, mocked models) |

### Client (run from `client/`)

| Command | Purpose |
|---------|---------|
| `npm install` | Install dependencies |
| `npm run dev` | Start Next.js dev server on `http://localhost:3000` |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint (Next.js core-web-vitals + TypeScript configs) |

### Full Local Setup

```bash
# Terminal 1 — server
cd server && cp .env.example .env && npm install && npm run dev

# Terminal 2 — client
cd client && cp .env.local.example .env.local && npm install && npm run dev
```

### Seed Admin User

```bash
cd server && node seed-admin.js
```
Admin credentials: `admin@fundflow.com` / `Admin@123456`

### Seed Demo Campaigns

```bash
cd server && NODE_ENV=development node seed-campaigns.js
```
Writes six approved campaigns with a matching credit ledger, so the landing
page has real content. It refuses to run when `NODE_ENV=production` (this
repo's `server/.env` sets it, so the override above is required). Add
`--prune-junk` to also remove the placeholder campaigns left by testing.

---

## Environment Variables

### Server (`.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Long random string for signing tokens |
| `STRIPE_SECRET_KEY` | No | Stripe secret key (platform degrades gracefully) |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret; without it no credits can be granted |
| `FIREBASE_SERVICE_ACCOUNT` | No | Firebase Admin service-account JSON (single line); without it `POST /auth/google` returns 503 |
| `CLIENT_URL` | Yes | Frontend origin for Stripe redirect URLs |
| `PORT` | No | Server port (default 5000) |

### Client (`.env.local`)

All `NEXT_PUBLIC_*` vars are exposed to the browser.

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Yes | Backend URL (e.g. `http://localhost:5000`) |
| `NEXT_PUBLIC_IMGBB_KEY` | No | imgBB API key for image uploads |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase Auth config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | Firebase Auth config |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Firebase Auth config |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Yes | Firebase Auth config |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Yes | Firebase Auth config |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Yes | Firebase Auth config |

---

## Architecture Highlights

### Authentication
- **Firebase Auth** (email/password + Google OAuth) on client
- **JWT** issued by server after Firebase verification; stored in `localStorage` as `cf_token`
- Client attaches JWT via Axios interceptor (`client/lib/api.js`)
- Server verifies JWT in `middleware/verifyToken.js`; role checks in `middleware/verifyRole.js`
- Three roles: `supporter`, `creator`, `admin` — each gets a dedicated dashboard

### Credit Economy
- Supporters buy credits: **10 credits = $1**
- Creators withdraw: **20 credits = $1** (platform margin)
- Minimum withdrawal: **200 raised credits** ($10)

### Campaign Lifecycle
1. Creator submits campaign → status `pending`
2. Admin approves/rejects → status `active`/`rejected`
3. Supporters contribute → status `pending` on contribution
4. Creator approves/rejects contribution → if rejected, credits auto-refunded
5. Campaign deletion refunds all approved contributions

### Key Server Routes
All prefixed with `/api/`:

| Domain | Routes |
|--------|--------|
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/google`, `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/me` |
| Campaigns | `GET /campaigns` (`status=approved` is public; any other status or bare request needs an admin token; non-string `status` → 400), `GET /campaigns/top-funded`, `GET /campaigns/mine`, `POST /campaigns`, `PATCH /campaigns/:id`, `DELETE /campaigns/:id` (creator: own campaigns; admin: any campaign — supporters are refunded either way), `PATCH /campaigns/:id/status` (admin) |
| Contributions | `POST /contributions` (400 if supporter lacks credits; debits before insert, credits back if insert fails), `GET /contributions/mine`, `GET /contributions/campaign/:id`, `PATCH /contributions/:id/approve`, `PATCH /contributions/:id/reject` |
| Withdrawals | `POST /withdrawals`, `GET /withdrawals` (admin), `GET /withdrawals/mine`, `PATCH /withdrawals/:id/approve` (admin) |
| Payments | `GET /payments/mine`, `GET /payments/all` (admin) — credits are granted only by the Stripe webhook |
| Notifications | `GET /notifications` |
| Reports | `POST /reports`, `GET /reports` (admin) |
| Users | `GET /users` (admin), `DELETE /users/:id` (admin), `PATCH /users/:id/role` (admin), `GET /users/stats` (admin) |
| Stripe | `POST /stripe/create-checkout-session` (503 when `CLIENT_URL` is missing or still the `.env.example` placeholder), `POST /stripe/webhook` (signature-verified; the only path that grants credits) |

### Client Routing (App Router)
- Public: `/`, `/campaigns`, `/campaigns/[id]`, `/login`, `/register`
- Protected dashboards under `/dashboard/`:
  - `/dashboard` — redirects by role
  - `/dashboard/creator-home`, `/dashboard/manage-campaigns`, `/dashboard/add-campaign`, `/dashboard/contributions-review`, `/dashboard/withdrawal-requests`, `/dashboard/payment-history`, `/dashboard/purchase-credit`
  - `/dashboard/supporter-home`, `/dashboard/my-contributions`, `/dashboard/explore`, `/dashboard/explore/[id]`
  - `/dashboard/admin-home`, `/dashboard/campaign-approvals`, `/dashboard/manage-users`, `/dashboard/reports`, `/dashboard/withdrawal-requests`

---

## Testing

### Server
- **Framework**: Jest + Supertest — no real database; each test file `jest.mock`s the Mongoose models with in-memory stores (`mongodb-memory-server` is an unused devDependency)
- **Command**: `npm test` (runs 131 tests across 12 suites)
- **Config**: `package.json` → `"jest": { "testEnvironment": "node" }`
- Tests isolated in `server/tests/` — each file targets a route group or middleware

### Client
- No test suite currently configured.

---

## Linting & Formatting

### Client
- **ESLint**: `npm run lint` (extends `eslint-config-next` core-web-vitals + TypeScript)
- **Config**: `eslint.config.mjs` (flat config)
- **Ignored**: `.next/**`, `out/**`, `build/**`, `next-env.d.ts`

### Server
- No lint configured.

---

## Deployment

### Vercel (both client and server)

**Server**: Deploy `server/` as a Vercel Node.js function.
- `vercel --prod` from `server/`
- Set all env vars in Vercel dashboard

**Client**: Deploy `client/` as Next.js app.
- `vercel --prod` from `client/`
- Env vars in Vercel dashboard (see `vercel.json` for variable names)

---

## Notable Quirks

1. **Next.js 16** — Uses Turbopack via `@tailwindcss/turbopack`; the auto-generated `AGENTS.md` in `client/` warns about breaking changes vs. training data.

2. **Dual Auth** — Firebase handles sign-in; server issues its own JWT for API auth. Don't confuse the two tokens. The server never trusts a client-supplied email: `POST /auth/google` accepts only a Firebase ID token and verifies it with the Admin SDK.

3. **Stripe Optional, Credits Not** — the platform degrades gracefully if `STRIPE_SECRET_KEY` is missing, but credits are granted **only** by the signature-verified `POST /stripe/webhook`. There is no request-body path that mints credits and no demo fallback.

4. **Rate Limiting** — Auth routes limited to 20 req/15 min/IP (`express-rate-limit`); skipped in test env.

5. **CORS** — Server allows `CLIENT_URL` + `localhost:3000` in dev; only `CLIENT_URL` in prod.

6. **Image Upload** — imgBB direct upload via `client/lib/uploadImage.js`; falls back to URL input.

7. **Notifications** — Bell icon polls `/api/notifications` every 30s; 6 event types insert notifications.

8. **Path Aliases** — Client uses `@/*` → `./*` (see `tsconfig.json`).

9. **Withdrawal double-claim guard** — `POST /withdrawals` subtracts the creator's already-pending withdrawal requests from raised credits before approving a new one, so the same credits cannot be claimed twice. There is no withdrawal reject route — only `PATCH /withdrawals/:id/approve` (admin).

---

## Files to Reference for Details

- `client/README.md` — Full feature list & local setup
- `server/README.md` — Complete API route table & deploy steps
- `client/lib/api.js` — Axios instance + JWT interceptor
- `client/context/AuthContext.jsx` — Client auth state + JWT decode
- `server/middleware/verifyToken.js` — Server JWT verification
- `server/middleware/verifyRole.js` — Role-based access control
- `client/vercel.json` — Client env var mapping for Vercel

<!-- caveman-begin -->
Respond terse like smart caveman. All technical substance stay. Only fluff die.

Rules:
- Answer first: Answer, then reason, then next step.
- Kill ceremony: No greeting, hedging, pleasantries, recap, or closer.
- Short word: "fix" not "implement a solution for".
- Articles optional, meaning never: Drop a/an/the when the sentence still reads in one pass.
- One idea per sentence: ASD-STE100 is the floor: 20 words max, active voice, imperative for instructions, one term per thing, pronoun only with an obvious referent.
- Payload verbatim: Code blocks unchanged.
- Tool runs: bounded status: No text between routine calls.
- User's language: Compress the style, not the language.
- Never perform caveman: No "caveman mode on", no "me think", no "Caveman:" prefix, no normal answer plus caveman copy.

Switch: /caveman (default), /ultracave (fragments, each fact once), /megacave (Classical Chinese 文言文)
Stop: "stop caveman" or "normal mode"

Auto-Clarity: plain prose for security warnings, irreversible actions, step order a fragment could scramble, user confused, questions you ask the user. Resume after.

Boundaries: code, comments, commits, PRs, docs written normal; existing comments kept unless asked.
Floor: code, commands, paths, numbers and error strings verbatim; never drop not/never/no/only.
<!-- caveman-end -->
