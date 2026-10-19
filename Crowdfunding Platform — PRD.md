# Crowdfunding Platform — PRD

Oct 13, 2026 · @Rahad

## Overview

A web-based crowdfunding platform where Creators raise money by collecting credits from Supporters. Supporters purchase credits with real money, contribute credits to campaigns, and Creators withdraw earned credits as cash once approved by Admin.

**Business model:** Supporters buy 10 credits for $1. Creators withdraw at 20 credits = $1. The platform keeps the spread.

**Three roles:** Supporter, Creator, Admin — each with a dedicated dashboard and isolated permissions.

## User Roles and Permissions

| Capability | Supporter | Creator | Admin |
| --- | --- | --- | --- |
| Browse approved campaigns | ✓ | — | — |
| Contribute credits to a campaign | ✓ | — | — |
| Purchase credit packages | ✓ | — | — |
| Create / manage campaigns | — | ✓ | — |
| Approve / reject contributions | — | ✓ | — |
| Request fund withdrawal | — | ✓ | — |
| Post campaign updates | — | ✓ | — |
| Approve / reject campaigns | — | — | ✓ |
| Process withdrawal requests | — | — | ✓ |
| Manage user roles | — | — | ✓ |
| Delete campaigns | — | — | ✓ |
| Handle fraud reports | — | — | ✓ |

**Default credits on registration:** Supporter = 50, Creator = 20. Credits are granted once, at registration.

## Auth System

### Registration

Fields: Name, Email, Profile Picture URL, Password, Role (dropdown: Supporter | Creator).

Validation: email format, password strength, duplicate email error. After success → redirect to Dashboard. Credits added once (Supporter 50, Creator 20) — stored in users collection alongside role.

Challenge: support imgBB upload for profile picture instead of URL input.

### Login

Two methods: email + password, Google Sign-In. Validate incorrect credentials with visible error. On success → redirect to Dashboard + store JWT access token in `localStorage`.

### Private Routes

Page reload on any private route must not redirect to login. Persist auth state via the stored token.

### Role-Based Authorization (Challenge)

Express middleware guards each dashboard role. Endpoints verify the user's role claim from the JWT before serving data.

## Public Pages

### Navbar

| State | Items |
| --- | --- |
| Logged-out | Logo, Explore Campaigns, Login, Register, Join as Developer |
| Logged-in | Logo (→ home), Dashboard, Available Credits, User Profile + Logout, Join as Developer |

"Join as Developer" links to the client GitHub repo.

### Home Page

Must use animation. Required sections:

1. **Hero** — Swiper/React-Responsive Carousel slider, 3 slides, each with unique heading and subtitle. Alternative: background video.
2. **Top Funded Campaigns** — 6 campaigns with highest credits raised. Shows cover image, title, total raised.
3. **Testimonials** — Static. Swiper slider. Each card: photo, name, quote.
4. **3+ Additional Sections** — Creator's choice (e.g. "How It Works", "Explore by Category", "Platform Impact in Numbers").

### Footer

Logo + social media icon links (LinkedIn, Facebook, GitHub) pointing to the developer's profiles.

## Creator Dashboard

### Home Stats

Total campaigns launched, active campaigns (deadline not passed), total credits raised across all campaigns.

### Contributions to Review

Table of all contributions with status = `pending`. Columns: supporter name, campaign title, contribution amount, View button (opens modal with full message).

Actions:

- **Approve** → add amount to campaign's `amount_raised`; set contribution `status = approved`.
- **Reject** → set `status = rejected`; refund credits to the Supporter's balance.

### Add New Campaign

Form fields: `campaign_title`, `campaign_story`, `category`, `funding_goal` (number), `minimum_contribution` (number), `deadline` (date), `reward_info`, `campaign_image_url`.

Saved with `status = pending`. Visible to Supporters only after Admin approves.

Challenge: use imgBB for image upload.

### My Campaigns

All creator's campaigns, descending by deadline. Columns: campaign info + Update + Delete buttons.

- **Update**: editable fields = title, campaign\_story, reward\_info.
- **Delete**: removes from DB; refunds all approved Supporters their contribution credits.

### Withdrawals

Minimum to withdraw: 200 raised credits (= $10).

Shows current raised credits and equivalent dollar amount.

Form fields: Credits to Withdraw (number, ≤ total raised), Withdraw Amount (auto-calc, read-only; 20 credits = $1), Payment System (dropdown: Stripe required; Bkash/Rocket/Nagad optional), Account Number.

If insufficient credits, hide Withdraw button and show "Insufficient credit".

On submit: save `{creator_email, creator_name, withdrawal_credit, withdrawal_amount, payment_system, withdraw_date, status: 'pending'}` to `withdrawals` collection.

### Payment History

Table of all Creator withdrawal payments.

## Supporter Dashboard

### Home Stats

Total contributions made (count), total pending contributions (count, status = pending), total amount contributed (sum of `contribution_amount` where status = approved).

### Explore Campaigns

Card grid of all campaigns where deadline has not passed and `status = approved`. Each card: campaign title, creator name, deadline, funding goal, amount raised, View Details button.

View Details → Campaign Details route.

### Campaign Details

Full campaign info + Contribution form. Form has one field: `contribution_amount` (number). On submit → insert to `contributions` collection: `{campaign_id, campaign_title, contribution_amount, supporter_email, supporter_name, creator_name, creator_email, current_date, status: 'pending'}`.

### My Contributions

All contributions where `supporter_email` = logged-in user. Tabular. Highlight status column. Pagination required (Challenge).

### Purchase Credit

Credit packages (Stripe checkout):

| Credits | Price |
| --- | --- |
| 100 | $10 |
| 300 | $25 |
| 800 | $60 |
| 1500 | $110 |

Each card click → Stripe payment for that amount. On success: save payment info, increase Supporter's credit balance. Fallback: dummy payment if Stripe not integrated.

### Payment History

Table of all Supporter credit purchases.

## Admin Dashboard

### Home Stats

Count of total Supporters, total Creators, total available credits (sum of all users' credits), total payments processed.

### Campaign Approvals

Table of all campaigns with `status = pending`. Actions:

- **Approve** → set `status = approved`; campaign becomes visible to Supporters.
- **Reject** → set `status = rejected`; notify Creator.

### Withdrawal Requests

Table of all withdrawals with `status = pending`. Action:

- **Payment Success** → set `status = approved`; decrease Creator's raised credits by `withdrawal_credit`.

### Manage Users

Table: display\_name, user\_email, photo\_url, role, credits. Actions:

- **Remove** → delete user from DB.
- **Update Role** → dropdown (Admin | Creator | Supporter); on change, updates role immediately.

### Manage Campaigns

Full campaign list in table. Action: Delete Campaign (removes from DB).

### Reports

Table of campaigns reported as suspicious/fraudulent. Columns: reporter name, campaign title, reason, date. Actions: Suspend or Delete reported campaign.

## Credit and Payment System

### Credit Economy

- Supporter buys: 10 credits = $1.
- Creator withdraws: 20 credits = $1.
- Platform margin: 50% of all credits transacted.

### Credit Packages (Supporter)

| Credits | Price |
| --- | --- |
| 100 | $10 |
| 300 | $25 |
| 800 | $60 |
| 1500 | $110 |

Payment via Stripe Checkout. On success: `payments` record saved, user credits incremented.

### Withdrawal (Creator)

Minimum threshold: 200 raised credits.

Stripe payout required. Bkash, Rocket, Nagad are optional UI options.

Withdrawal record schema: `creator_email`, `creator_name`, `withdrawal_credit`, `withdrawal_amount`, `payment_system`, `account_number`, `withdraw_date`, `status` (`pending` → `approved`).

### Data Collections

| Collection | Key Fields |
| --- | --- |
| `users` | email, name, photo, role, credits |
| `campaigns` | title, story, category, goal, raised, deadline, reward, image, creator\_email, status |
| `contributions` | campaign\_id, amount, supporter\_email, creator\_email, date, status |
| `withdrawals` | creator\_email, credit, amount, payment\_system, account, date, status |
| `payments` | supporter\_email, credits, amount, date |
| `notifications` | message, toEmail, actionRoute, time |
| `reports` | reporter\_email, campaign\_id, reason, date |

## Notification System

Notifications are stored in a `notifications` collection and shown per user.

### Document Shape

```
{
  message: string,
  toEmail: string,
  actionRoute: string,
  time: Date
}
```

### Trigger Events

| Event | Recipient | Message template |
| --- | --- | --- |
| Supporter contributes | Creator | "New contribution of {amount} credits to {campaign} from {supporter}" |
| Creator approves contribution | Supporter | "Your contribution of {amount} credits to {campaign} was approved by {creator}" |
| Creator rejects contribution | Supporter | "Your contribution of {amount} credits to {campaign} was rejected by {creator}" |
| Admin approves campaign | Creator | "Your campaign {campaign} was approved" |
| Admin rejects campaign | Creator | "Your campaign {campaign} was rejected" |
| Admin approves withdrawal | Creator | "Your withdrawal of ${amount} was processed" |

### UI Behavior

- Notification bell icon in dashboard header.
- Click → floating pop-up listing all notifications where `toEmail` = current user's email, sorted newest first.
- Click anywhere outside pop-up → close it.

## Technical Constraints and Delivery

### Stack

- **Frontend:** Next.js (App Router) + any CSS library or vanilla CSS.
- **Backend:** Node.js + Express.
- **Database:** MongoDB (use environment variables for credentials).
- **Auth:** Firebase Auth (email/password + Google) or equivalent. JWT stored in `localStorage`.
- **Payments:** Stripe (required for Supporter credit purchase; optional for Creator withdrawal).
- **Image upload:** imgBB (challenge mark).
- **Hosting:** Vercel (both client and server). Deploy on day 1.

### GitHub Commit Requirements

- Client side: minimum 20 notable commits.
- Server side: minimum 12 notable commits.

### README Requirements

Minimum 10 bullet points covering features. Must include: site name, admin email, admin password, live site URL.

### Quality Rules

- No lorem ipsum text anywhere.
- Fully responsive: mobile, tablet, desktop — including all dashboard views.
- Private routes persist auth on reload (no redirect to login).
- All config keys and MongoDB credentials in `.env` files, never committed.

### Challenge Features (marked in requirements)

- imgBB image upload on registration and Add New Campaign.
- Pagination on My Contributions (Supporter).
- Role-Based Authorization middleware (Supporter, Creator, Admin).
- Stripe withdrawal for Creator.

## Optional Features

Not required for submission. Implement for extra credit.

1. **Automated Email Notifications** — SendGrid or AWS SES. Trigger on: campaign approval/rejection, contribution confirmation, withdrawal processing.
2. **Advanced Search and Filter** — Filter campaigns by category, deadline, funding goal, status. Use MongoDB aggregation pipeline for server-side filtering.
3. **Report System** — Supporters can flag campaigns as suspicious/fraudulent. Admin sees the report queue and can suspend or delete reported campaigns.
