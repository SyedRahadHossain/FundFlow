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
- **Password recovery:** `POST /api/auth/forgot-password` always answers the same way (it never says whether an account exists). A single-use token is stored hashed, with a one-hour expiry and one live link per account; `POST /api/auth/reset-password` spends it and invalidates the rest. No email provider is configured: outside production the link is printed to the server console, in production it is never emitted.
- **Credit economy:** Purchase → Stripe Checkout (the route answers 503 when Stripe is not configured — there is no demo minting path; credits are granted only by the verified Stripe webhook) → server records Payment → Supporter credits increment. Contribution → Creator approve → credits transfer to Creator balance. Withdrawal → Creator requests ≥200 credits → Admin approves → dollar amount auto-calculated at 20c=$1.
- **Campaign lifecycle:** Creator submits (status `pending`) → Admin approves/rejects → `active`/`rejected` → Supporters contribute (status `pending`) → Creator approves/rejects → approved = credits move, rejected = instant refund → Creator can delete → all approved contributions auto-refunded.
- **Notifications:** One shared 30s poll (`client/lib/poller.js`) feeds the bell and the sidebar counts; it is skipped while the tab is hidden. 6 event types insert notifications (campaign approved/rejected, contribution received/approved/rejected, withdrawal approved).
- **Images:** Profile photo and campaign cover upload directly to imgBB via client; URL fallback when imgBB key missing.
- **Rate limiting:** Auth routes limited to 20 req/15 min/IP (express-rate-limit; skipped in test env).
- **CORS:** Dev allows `CLIENT_URL` + `localhost:3000`; prod allows only `CLIENT_URL`.

## Capabilities and Constraints

- **Stack:** Next.js 16 (App Router), Tailwind CSS v4, Express, MongoDB/Mongoose, Firebase Auth, Stripe Checkout, imgBB, Vercel hosting.
- **CSS variables** defined in `client/app/globals.css` as a Tailwind v4 `@theme` block (indigo primary, teal accent, full neutral scale, semantic colors, surfaces, field tints). Components consume them as Tailwind theme utilities (`bg-primary`, `text-accent`, `border-error`), so the token file is the only place a colour is written.
- **Dark mode:** Implemented via a `prefers-color-scheme` media query plus a manual toggle in the navbar and the dashboard top bar. The choice is persisted in `localStorage['fundflow-theme']` and applied before first paint, so there is no flash of the wrong theme.
- **Theme switching:** Implemented. The whole neutral ramp, the semantic tints and the native surfaces (scrollbars, selects, autofill, caret) invert with the theme.
- **Stripe:** Optional — checkout answers 503 when `STRIPE_SECRET_KEY` or `CLIENT_URL` is missing, and credits are granted only by the signature-verified webhook. The client checks for the publishable key.
- **Testing:** Server has 200 Jest + Supertest tests across 19 suites (the models are mocked, so no database is needed). The client has a `node --test` suite (`client/tests/`) covering the file-drop path, the filter state and the session rule.
- **Linting:** Client has ESLint (flat config, extends next/core-web-vitals + TypeScript). Server has no lint configured.
- **Accessibility baseline:** Focus rings (3px primary), 44px touch targets, `prefers-reduced-motion` respected, ARIA labels/roles/states on interactive elements, alt text on images, decorative emoji `aria-hidden="true"`.

## Brand Commitments

- **Name:** FundFlow (established, can evolve)
- **Primary color:** Indigo (#4f46e5) — established in DESIGN.md and globals.css, can evolve
- **Font:** System stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif`)
- **Visual identity:** the "Trust Ledger" north star and its named rules (Constant Field, Credit Role, Money Is Ink, One Voice) are documented in DESIGN.md and enforced by the token file. The wordmark, the system stack and the one icon vocabulary are settled; a voice guide is not yet written.

## Evidence on Hand

- **Live site:** https://fundflow-client-wine.vercel.app
- **Admin seed credentials:** `admin@fundflow.com` / `Admin@123456`
- **Server test suite:** 200 passing tests covering auth, password recovery, campaigns, campaign search, contributions, withdrawals, payments, notifications, reports, users, Stripe, middleware, models.
- **Design tokens:** Documented in `client/DESIGN.md` and implemented as CSS variables in `client/app/globals.css`.
- **Component library:** `client/components/ui/` (Button, Input, Modal, Card, Avatar, ProgressBar, Badge, EmptyState, Icon, ErrorBanner) + dashboard/layout components (Navbar, DashboardSidebar, NotificationBell, HeroSlider, CreditConverter, HowItWorks, PlatformImpact, StatCard, CampaignCard, CampaignDetail, CampaignsBrowser, TopFundedCampaigns, Testimonials, Footer, ConfirmDialog, ErrorBoundary).
- **Route map:** Public (`/`, `/campaigns`, `/campaigns/[id]`, `/login`, `/register`) + Protected dashboards under `/dashboard/` (role-specific home, campaign management, contributions review, withdrawals, payment histories, credit purchase, users, reports, admin approvals, explore).

**Absences future work must not fabricate:** testimonials, customer logos, case studies, press mentions, benchmark metrics, pricing tiers beyond the credit conversion rates, licensing terms, deployment guarantees.

## Product Principles

1. **Trust via reversibility** — Every value transfer (contribution, campaign, withdrawal) has a clear reversal path (refund, rejection, admin oversight). The system defaults to protecting the Supporter's credits.
2. **Role clarity over feature density** — Each dashboard shows only what that role needs; no mixed-context UI. Server-enforced JWT roles prevent privilege escalation.
3. **Asymmetric economy as feature** — The 10c-in / 20c-out spread is not hidden; it's the business model. UI surfaces conversion rates transparently.
4. **Graceful degradation** — Stripe optional, imgBB optional, and the image upload falls back to a URL field. No single third-party dependency blocks the core flows; nothing is granted optimistically that the server has not confirmed.
5. **Observable state** — Real-time notifications (one shared 30s poll), contribution status visibility, withdrawal tracking, campaign status transparency. A failed request says so and offers a retry; it never renders as an empty list.

## Accessibility & Inclusion

Current baseline (3px focus rings, a 44px minimum touch target enforced by the button kit, reduced motion respected, ARIA roles and live regions, alt text, decorative emoji hidden) is sufficient. No product-specific WCAG 2.1 AA requirement or regulatory mandate established.