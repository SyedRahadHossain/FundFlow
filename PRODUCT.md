# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Primary:** Three equal audiences — Supporters, Creators, Admins — each with dedicated workflows and success metrics.

- **Supporters** browse active campaigns, purchase credit packages (10 credits = $1), contribute to campaigns, track contribution history, and report suspicious campaigns.
- **Creators** submit campaigns for approval, manage active campaigns, review and approve/reject pending contributions (rejection triggers instant credit refund), request withdrawals once 200+ credits raised (20 credits = $1), and view payment history.
- **Admins** approve/reject pending campaigns, manage all users and roles, review all withdrawal requests, monitor platform stats, and handle reported campaigns.

## Product Purpose

FundFlow is a crowdfunding platform where Creators raise money by collecting credits from Supporters. The platform operates a dual-currency credit economy: Supporters buy in at 10 credits = $1; Creators cash out at 20 credits = $1. The asymmetric conversion is the platform's built-in margin. Campaigns require Admin approval before going live; Creators control contribution acceptance; deleting a campaign auto-refunds all approved Supporters.

**Success** means: active campaigns with steady contribution flow, low dispute rate via the approval workflow, sustainable platform margin from the credit spread, and trust signals (notifications, reporting, transparent conversion rates) that retain all three roles.

## Positioning

The meaningfully different mechanism a neighboring product could not truthfully copy is the **asymmetric credit economy (10c=$1 in, 20c=$1 out) combined with a three-role gated workflow where every contribution requires Creator approval and every campaign requires Admin approval, with auto-refund on campaign deletion**. This creates a trust-first loop: Supporters know credits are refundable if a Creator rejects or a campaign disappears; Creators control quality; Admins gate entry.

## Operating Context

- **Auth flow:** Firebase Auth (email/password + Google OAuth) → server verifies Firebase token → issues own JWT (`cf_token` in localStorage) → client attaches JWT via Axios interceptor → server verifies JWT + role per request.
- **Credit economy:** Purchase → Stripe Checkout (degrades to demo mode without keys) → server records Payment → Supporter credits increment. Contribution → Creator approve → credits transfer to Creator balance. Withdrawal → Creator requests ≥200 credits → Admin approves → dollar amount auto-calculated at 20c=$1.
- **Campaign lifecycle:** Creator submits (status `pending`) → Admin approves/rejects → `active`/`rejected` → Supporters contribute (status `pending`) → Creator approves/rejects → approved = credits move, rejected = instant refund → Creator can delete → all approved contributions auto-refunded.
- **Notifications:** Bell icon polls `/api/notifications` every 30s; 6 event types insert notifications (campaign approved/rejected, contribution received/approved/rejected, withdrawal approved).
- **Images:** Profile photo and campaign cover upload directly to imgBB via client; URL fallback when imgBB key missing.
- **Rate limiting:** Auth routes limited to 20 req/15 min/IP (express-rate-limit; skipped in test env).
- **CORS:** Dev allows `CLIENT_URL` + `localhost:3000`; prod allows only `CLIENT_URL`.

## Capabilities and Constraints

- **Stack:** Next.js 14 (App Router), Tailwind CSS, Express, MongoDB/Mongoose, Firebase Auth, Stripe Checkout, imgBB, Vercel hosting.
- **CSS variables** defined in `client/app/globals.css` (indigo primary, teal accent, full neutral scale, semantic colors, surfaces, shadows, radius). Components currently use Tailwind classes directly; migration to CSS variables pending.
- **Dark mode:** Implemented via `prefers-color-scheme` media query in globals.css; no manual toggle yet.
- **Theme switching:** Not implemented.
- **Stripe:** Optional — platform degrades gracefully to demo mode when `STRIPE_SECRET_KEY` absent. Client checks for publishable key.
- **Testing:** Server has 63 Jest + Supertest + mongodb-memory-server tests. Client has no test suite configured.
- **Linting:** Client has ESLint (flat config, extends next/core-web-vitals + TypeScript). Server has no lint configured.
- **Accessibility baseline:** Focus rings (3px primary), 44px touch targets, `prefers-reduced-motion` respected, ARIA labels/roles/states on interactive elements, alt text on images, decorative emoji `aria-hidden="true"`.

## Brand Commitments

- **Name:** FundFlow (established, can evolve)
- **Primary color:** Indigo (#4f46e5) — established in DESIGN.md and globals.css, can evolve
- **Font:** System stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif`)
- **No logo, voice guide, or personality constraints currently documented** — visual identity open for evolution.

## Evidence on Hand

- **Live site:** https://fundflow.vercel.app (needs update after deploy)
- **Admin seed credentials:** `admin@fundflow.com` / `Admin@123456`
- **Server test suite:** 63 passing tests covering auth, campaigns, contributions, withdrawals, payments, notifications, reports, users, Stripe, middleware, models.
- **Design tokens:** Documented in `client/DESIGN.md` and implemented as CSS variables in `client/app/globals.css`.
- **Component library:** `client/components/ui/` (Button, Input, Modal, Card, Avatar, ProgressBar, Badge, EmptyState) + dashboard/layout components (Navbar, DashboardSidebar, NotificationBell, HeroSlider, StatCard, CampaignCard, TopFundedCampaigns, Testimonials, Footer, ConfirmDialog, ErrorBoundary).
- **Route map:** Public (`/`, `/campaigns`, `/campaigns/[id]`, `/login`, `/register`) + Protected dashboards under `/dashboard/` (role-specific home, campaign management, contributions, withdrawals, payments, users, reports, admin approvals).

**Absences future work must not fabricate:** testimonials, customer logos, case studies, press mentions, benchmark metrics, pricing tiers beyond the credit conversion rates, licensing terms, deployment guarantees.

## Product Principles

1. **Trust via reversibility** — Every value transfer (contribution, campaign, withdrawal) has a clear reversal path (refund, rejection, admin oversight). The system defaults to protecting the Supporter's credits.
2. **Role clarity over feature density** — Each dashboard shows only what that role needs; no mixed-context UI. Server-enforced JWT roles prevent privilege escalation.
3. **Asymmetric economy as feature** — The 10c-in / 20c-out spread is not hidden; it's the business model. UI surfaces conversion rates transparently.
4. **Graceful degradation** — Stripe optional, imgBB optional, demo modes functional. No single third-party dependency blocks core flows.
5. **Observable state** — Real-time notifications (30s poll), contribution status visibility, withdrawal tracking, campaign status transparency. No silent state changes.

## Accessibility & Inclusion

Current baseline (focus rings, 44px touch targets, reduced motion, ARIA, alt text, decorative emoji handling) is sufficient. No product-specific WCAG 2.1 AA requirement or regulatory mandate established.