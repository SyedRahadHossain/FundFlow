# FundFlow — Crowdfunding Platform

A full-stack crowdfunding platform where Creators raise money by collecting credits from Supporters. Supporters buy credits, back campaigns, and Creators withdraw what they raise.

## Repository Layout

Two independent packages, each with its own `package.json`, `node_modules`, and environment file.

```
fundflow-complete/
├── client/   Next.js 16 front end (App Router, Tailwind CSS)
└── server/   Express + MongoDB REST API
```

## Tech Stack

- **Frontend:** Next.js 16 (App Router), Tailwind CSS
- **Backend:** Node.js, Express
- **Database:** MongoDB + Mongoose
- **Auth:** Firebase Auth + JWT
- **Payments:** Stripe Checkout
- **Images:** imgBB API
- **Hosting:** Vercel

## How It Works

Supporters buy credits at **10 credits = $1**. Creators withdraw raised credits at **20 credits = $1**; the spread is the platform margin. The minimum withdrawal is **200 raised credits** ($10).

Credit packages are fixed server-side, so a client chooses *which* package to buy, never what it costs:

| Credits | Price |
|--------:|------:|
| 100 | $10 |
| 300 | $25 |
| 800 | $60 |
| 1500 | $110 |

## Roles

| Role | Can do |
|------|--------|
| Supporter | Buy credits, browse and back campaigns, track contributions and status |
| Creator | Create campaigns, review contributions, request withdrawals, post updates |
| Admin | Approve campaigns, manage users, approve payouts, view reports and platform stats |

Campaign lifecycle: a Creator submits a campaign, an Admin approves it, Supporters contribute, and the Creator approves or rejects each contribution. A rejected contribution refunds the Supporter's credits instantly. Deleting a campaign refunds every approved contributor.

## Quick Start

```bash
# Terminal 1 — server
cd server
cp .env.example .env        # fill in MONGODB_URI and JWT_SECRET
npm install
node seed-admin.js          # optional: seeds the admin account
npm run dev                 # http://localhost:5000

# Terminal 2 — client
cd client
cp .env.local.example .env.local   # fill in the Firebase config
npm install
npm run dev                 # http://localhost:3000
```

## Admin Credentials

- **Email:** `admin@fundflow.com`
- **Password:** `Admin@123456`

## Environment Variables

### Server (`server/.env`)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | Yes | MongoDB Atlas connection string |
| `JWT_SECRET` | Yes | Long random string for signing tokens |
| `STRIPE_SECRET_KEY` | No | Stripe secret key (platform degrades gracefully without it) |
| `STRIPE_WEBHOOK_SECRET` | No | Stripe webhook signing secret. Without it, no credits can be granted |
| `FIREBASE_SERVICE_ACCOUNT` | No | Firebase Admin service-account JSON (single line). Without it, `POST /api/auth/google` returns 503 |
| `CLIENT_URL` | Yes | Frontend origin, used for Stripe redirect URLs |
| `PORT` | No | Server port (default 5000) |

### Client (`client/.env.local`)

All `NEXT_PUBLIC_*` variables are exposed to the browser.

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

## Stripe

Credits are granted **only** by the signature-verified `POST /api/stripe/webhook`. There is no request-body path that mints credits, and no demo fallback — if the webhook is not configured, a completed payment grants nothing.

For local development, forward webhook events yourself:

```bash
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

Use the `whsec_...` value that command prints as `STRIPE_WEBHOOK_SECRET`. A Dashboard endpoint's signing secret is a different value and will fail signature verification against a local session.

Checkout sessions are created server-side with the price taken from `server/lib/creditPackages.js`.

## Testing

| Package | Command | Coverage |
|---------|---------|----------|
| server | `npm test` | 122 tests across 11 suites (Jest + Supertest, mocked models) |
| client | `npm run lint` | ESLint (Next.js core-web-vitals + TypeScript) |

The server suite uses in-memory model mocks and needs no database.

## Deployment

Both halves deploy to Vercel as separate projects.

```bash
cd server && vercel --prod
cd client && vercel --prod
```

Set each project's environment variables in the Vercel dashboard.

## Documentation

- [`client/README.md`](./client/README.md) — feature list, tech stack, local setup
- [`server/README.md`](./server/README.md) — full API route table, environment variables, deploy steps
- [`AGENTS.md`](./AGENTS.md) — repository conventions for AI agents
