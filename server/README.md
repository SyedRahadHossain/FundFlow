# FundFlow — Server

Express + MongoDB REST API for the FundFlow crowdfunding platform.

## Live URL

> Update after deploying to Vercel.

## Source Code

Client and server ship from a single repository.

- **Repository:** https://github.com/SyedRahadHossain/FundFlow
- **Server source (this directory):** https://github.com/SyedRahadHossain/FundFlow/tree/main/server
- **Client source:** https://github.com/SyedRahadHossain/FundFlow/tree/main/client

## Setup

```bash
npm install
cp .env.example .env   # fill in your values
npm run dev            # http://localhost:5000
npm test               # run 131 tests (12 suites)
```

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
| GET | `/api/auth/me` | Any | Current user profile |
| GET | `/api/campaigns` | Approved public; other statuses Admin | List campaigns (`status` filter) |
| GET | `/api/campaigns/top-funded` | — | Top 6 by amount raised |
| GET | `/api/campaigns/mine` | Creator | Creator's own campaigns |
| POST | `/api/campaigns` | Creator | Create campaign |
| PATCH | `/api/campaigns/:id` | Creator | Update title/story/reward |
| POST | `/api/campaigns/:id/updates` | Creator | Post a progress update to backers |
| DELETE | `/api/campaigns/:id` | Creator | Delete + refund supporters |
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

## Deploy to Vercel

```bash
vercel --prod
```

Set all environment variables in Vercel dashboard → Settings → Environment Variables.
