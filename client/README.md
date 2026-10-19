# FundFlow — Crowdfunding Platform

A full-stack crowdfunding platform where Creators raise money by collecting credits from Supporters.

## Admin Credentials

- **Admin Email:** `admin@fundflow.com`
- **Admin Password:** `Admin@123456`

## Live Site

> https://fundflow.vercel.app  ← update after deploy

## Features

- **3-role system** — Supporter, Creator and Admin each get a dedicated dashboard with role-gated routes and server-side JWT verification
- **Credit economy** — Supporters buy credits (10 credits = $1); Creators withdraw earned credits (20 credits = $1); the spread is the platform margin
- **Stripe payments** — Supporters purchase credit packages via Stripe Checkout; falls back to a demo mode when Stripe is not configured
- **Campaign lifecycle** — Creators submit campaigns; Admin approves or rejects before they go live; Supporters browse and contribute
- **Contribution review** — Creators approve or reject pending contributions; rejected contributions refund the Supporter's credits instantly
- **Campaign updates** — Creators post progress updates to backers; they appear newest-first on the public Campaign Details page
- **Testimonials slider** — Home page runs a Swiper carousel of static supporter and creator quotes that pauses under reduced-motion
- **Campaign delete with refund** — Deleting a campaign automatically refunds every approved Supporter their contribution amount
- **Withdrawal system** — Creators request payouts once they accumulate 200+ raised credits; Admin marks payment success; dollar amount auto-calculates at 20 credits = $1
- **Real-time notifications** — Bell icon in every dashboard polls every 30 seconds; all 6 platform events insert notifications
- **imgBB image upload** — Profile photo and campaign cover image support direct file upload via imgBB API with a URL fallback
- **Paginated contributions** — Supporter My Contributions table paginates server-side (10 per page)
- **Responsive design** — All pages and dashboards adapt to mobile, tablet and desktop with a collapsible sidebar
- **Google Sign-In** — Firebase Auth supports Google OAuth alongside email/password; private routes persist auth across reloads via localStorage JWT

## Tech Stack

- Frontend: Next.js 16 (App Router), Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB + Mongoose
- Auth: Firebase Auth + JWT
- Payments: Stripe Checkout
- Images: imgBB API
- Hosting: Vercel

## Local Setup

```bash
cd server && cp .env.example .env && npm install && npm run dev
cd client && cp .env.local.example .env.local && npm install && npm run dev
```

## Seed Admin

```bash
cd server && node seed-admin.js
```
