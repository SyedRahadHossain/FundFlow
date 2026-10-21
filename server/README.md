# FundFlow — Server

Express + MongoDB REST API for the FundFlow crowdfunding platform.

## Live URL

> https://fundflow-server-seven.vercel.app

## Source Code

Client and server ship from a single repository.

- **Repository:** https://github.com/SyedRahadHossain/FundFlow
- **Server source (this directory):** https://github.com/SyedRahadHossain/FundFlow/tree/main/server
- **Client source:** https://github.com/SyedRahadHossain/FundFlow/tree/main/client

## Features

- **3-role authorization** — `verifyRole` guards every protected route and the JWT role claim decides access; the request body never does
- **Public catalog gate** — only `status=approved` is readable without a token; every other status needs an Admin, and a non-string filter is a 400
- **Credit economy** — 10 credits = $1 bought, 20 credits = $1 withdrawn, 200 raised credits minimum per withdrawal
- **Atomic contributions** — the debit is conditional on the balance, runs first, and is compensated if the insert fails
- **Withdrawal double-claim guard** — a creator's pending requests are subtracted before a new one is approved, so the same credits cannot be claimed twice
- **Campaign delete refunds** — deleting a campaign refunds every Supporter with an approved or pending contribution
- **Stripe webhook is the only credit path** — signature-verified, amount cross-checked against the metadata the server authored, idempotent on `stripe_session_id`
- **Dashboard counts** — one route serves every role's tiles instead of counting array lengths in the browser
- **Notifications** — six platform events write a notification row for the recipient, read newest-first
- **Password recovery** — hashed single-use tokens, one-hour expiry, one live link per account, and the same answer for an unknown address
- **Campaign search on the server** — one aggregation answers a search, a filter set, a sort and a page, and returns the rows, the size of the whole filtered set and the category counts together
- **A content policy the server enforces** — campaigns that attack a religion or its followers, and campaigns about music, are refused at submission, at edit, at progress update and at publication; an admin can reject one but never publish it
- **Tested** — 242 Jest + Supertest tests over 21 suites, in-memory model mocks, no database required

## Setup

```bash
npm install
cp .env.example .env   # fill in your values
npm run dev            # http://localhost:5000
npm test               # run 242 tests (21 suites)
```

## Password recovery

`POST /api/auth/forgot-password` always answers the same way, so it never
reveals whether an account exists. For a known address it stores a single-use
token (hashed, one hour, one live link per account) and hands the reset URL to
the user.

**No email provider is configured yet.** Outside production the link is printed
to the server console; in production it is never emitted anywhere. A mail
provider still has to be wired before this route can deliver to a real user.

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Long random string for signing tokens |
| `STRIPE_SECRET_KEY` | Stripe secret key (optional — platform degrades gracefully) |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret. Without it, no credits can be granted |
| `FIREBASE_SERVICE_ACCOUNT` | Firebase Admin service-account JSON (single line). Without it, `POST /api/auth/google` returns 503 |
| `CLIENT_URL` | Frontend origin for Stripe redirect URLs |
| `PORT` | Server port (default 5000) |

## API Routes

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | — | Register new user |
| POST | `/api/auth/login` | — | Email/password login |
| POST | `/api/auth/google` | — | Google sign-in (verifies a Firebase ID token) |
| POST | `/api/auth/forgot-password` | — | Request a password reset link (always the same answer) |
| POST | `/api/auth/reset-password` | — | Set a new password with a reset token |
| GET | `/api/auth/me` | Any | Current user profile |
| GET | `/api/campaigns` | Approved public; other statuses Admin | List campaigns (`status` filter) |
| GET | `/api/campaigns/listing` | Approved public; other statuses Admin | Search, filter, sort and page campaigns (`q`, `category`, `deadline`, `minGoal`, `maxGoal`, `status`, `sort`, `page`, `limit`) |
| GET | `/api/read` | Same as the route it carries | A second way to read: `?route=campaigns\|campaigns/listing\|campaigns/mine\|campaigns/top-funded\|<campaign id>` |
| GET | `/api/campaigns/top-funded` | — | Top 6 by amount raised |
| GET | `/api/campaigns/mine` | Creator | Creator's own campaigns |
| POST | `/api/campaigns` | Creator | Create campaign |
| PATCH | `/api/campaigns/:id` | Creator | Update title/story/reward |
| POST | `/api/campaigns/:id/updates` | Creator | Post a progress update to backers |
| DELETE | `/api/campaigns/:id` | Creator (own) or Admin (any) | Delete + refund supporters |
| PATCH | `/api/campaigns/:id/status` | Admin | Approve / reject |
| POST | `/api/contributions` | Supporter | Submit contribution |
| GET | `/api/contributions/mine` | Supporter | Paginated own contributions |
| GET | `/api/contributions/campaign/:id` | Creator | Pending for their campaign |
| PATCH | `/api/contributions/:id/approve` | Creator | Approve + notify |
| PATCH | `/api/contributions/:id/reject` | Creator | Reject + refund |
| POST | `/api/withdrawals` | Creator | Request withdrawal (pending requests reduce available balance) |
| GET | `/api/withdrawals` | Admin | All pending withdrawals |
| GET | `/api/withdrawals/mine` | Creator | Own withdrawal history |
| PATCH | `/api/withdrawals/:id/approve` | Admin | Approve + notify |
| GET | `/api/payments/mine` | Supporter | Own payment history |
| GET | `/api/payments/all` | Admin | Total payment count |
| GET | `/api/notifications` | Any | Current user's notifications |
| POST | `/api/reports` | Supporter | Report a campaign |
| GET | `/api/reports` | Admin | All reports |
| DELETE | `/api/reports/:campaign_id/campaign` | Admin | Delete reported campaign + refund supporters |
| GET | `/api/users` | Admin | All users |
| DELETE | `/api/users/:id` | Admin | Remove user |
| PATCH | `/api/users/:id/role` | Admin | Change role |
| GET | `/api/users/stats` | Admin | Platform stats |
| POST | `/api/stripe/create-checkout-session` | Supporter | Stripe checkout (server-side pricing) |
| POST | `/api/stripe/webhook` | Stripe signature | Grant credits — the only path that mints credits |

## Stripe

Credits are granted **only** by `POST /api/stripe/webhook`. It verifies the `stripe-signature` header, accepts only `checkout.session.completed`, cross-checks the charged amount against the metadata this server wrote, and claims the event on a unique `stripe_session_id` so a replay cannot grant credits twice.

The endpoint must exist in Stripe itself, or no purchase grants anything:

1. Stripe Dashboard → **Webhooks** → add endpoint `https://fundflow-server-seven.vercel.app/api/stripe/webhook` (test mode) with the event `checkout.session.completed`
2. Copy the endpoint's signing secret into Vercel as `STRIPE_WEBHOOK_SECRET` (production target) and redeploy
3. The deployed endpoint is currently test-mode; a live Stripe key needs a live-mode endpoint and its own secret

For local development, forward events with the Stripe CLI instead:

```bash
stripe listen --forward-to localhost:5000/api/stripe/webhook
```

## A second way to read

Some networks drop requests whose path contains certain words, and the
symptom is a page that cannot load its own data while the API is healthy: no
response, no status, the fetch simply fails. A read that never arrives is
therefore asked for again through `GET /api/read`, which carries the route in
the query string instead of in the path.

It is a gateway over an allowlist, not a proxy. Only the reads named in
`READ_ROUTES` (and a campaign by its own id) are reachable through it;
anything else is a 400. The caller's token travels unchanged, and the route
it forwards to decides what the caller may see.

## Deploy to Vercel

```bash
vercel --prod
```

Set all environment variables in Vercel dashboard → Settings → Environment Variables.
