# Full-project code review — 2026-10-19

Scope: whole FundFlow project (`client/` and `server/`), reviewed at commit
`825148ea14db1b2ff9fa00b054dea406b89a5a61` (branch `main`, local branch `audit-findings`).

Reviewed for: AGENTS.md compliance, obvious bugs, git-history regressions, prior-review
findings, and code-comment/contract mismatches. Each candidate issue was scored 0–100 for
confidence; only issues scoring 80 or higher are listed. Everything below is a real defect on
the path described.

---

## 1. Deleting a campaign strands pending contribution credits

**File:** `server/lib/campaignLifecycle.js:20`
**Impact:** Permanent loss of supporter credits.

`deleteCampaignWithRefunds` only loads contributions with `status: 'approved'`:

```js
const approved = await Contribution.find({ campaign_id: campaignId, status: 'approved' });
```

But `POST /api/contributions` debits the supporter's credits immediately, before the
contribution defaults to `status: 'pending'` (`server/routes/contributions.js:46-49`,
`server/models/Contribution.js:12`). When the campaign is deleted, any contribution still
`pending` is never refunded, and the creator's review page builds its list from
`/api/campaigns/mine`, so the deleted campaign's rows are no longer reachable. The supporter
never gets the credits back.

**What to do**

1. In `deleteCampaignWithRefunds`, query every unclaimed contribution, not just approved:
   `Contribution.find({ campaign_id: campaignId, status: { $in: ['approved', 'pending'] } })`.
2. Keep the existing guarded claim (`status: 'approved'` → `refunded`) pattern, but extend it
   so `pending` rows are also moved to `refunded` and their credits returned to the supporter.
3. Add a regression test in `server/tests/contributions.test.js`: create a campaign, submit a
   contribution (stays `pending`), delete the campaign, assert the supporter's credit balance is
   restored and the contribution status is `refunded`.
4. Run `cd server && npm test`.

---

## 2. Admin dashboard stats are permanently wrong

**File:** `client/app/dashboard/admin-home/page.jsx:31-33`
**Impact:** Pending-campaign count, pending-withdrawal count, and payment volume always read 0.

The page reads fields the endpoints do not return:

- `GET /api/campaigns?status=pending` returns an array → `res.data.total` is `undefined` → `0`.
- `GET /api/withdrawals` returns an array → `res.data.total` is `undefined` → `0`.
- `GET /api/payments/all` returns only `{ total }` → `data.totalVolume` is always `$0`.

**What to do**

1. Switch these two counters to the counts endpoint the sidebar already uses
   (`GET /api/dashboard/counts`) and read the real field names.
2. Read payment volume from the field the endpoint actually returns, or add the total to
   `/api/payments/all` and expose it (`server/routes/payments.js`).
3. Verify the three tiles and the two sidebar badges show non-zero values against seeded data.
4. Run `cd client && npm run build`.

---

## 3. "Mark all read" does nothing and the unread badge never clears

**Files:** `server/models/Notification.js:3-8`, `server/routes/notifications.js:19`
**Impact:** Notifications are always treated as unread.

The schema has no `read` (or `type`) field, so Mongoose strict mode strips the update:

```js
await Notification.updateMany({ toEmail: req.user.email }, { $set: { read: true } });
```

`NotificationBell` computes `unread` from `!n.read`, which never exists, so the badge counts
every notification and reappears after each 30s poll. The bell also reads `n.type`, which is
never set.

**What to do**

1. Add `read: { type: Boolean, default: false }` (and `type: { type: String }` if the bell's
   per-type icon classes are wanted) to `server/models/Notification.js`.
2. Confirm `updateMany` now persists and the response `unread` count drops to 0.
3. Add a test in `server/tests/` asserting that mark-all-read persists and that a fresh fetch
   reports zero unread.
4. Run `cd server && npm test`.

---

## 4. Creator home pending-contribution count is always 0

**File:** `client/app/dashboard/creator-home/page.jsx:43`
**Impact:** Badge is permanently 0.

The call `/api/contributions/campaign/mine?status=pending` resolves to the `/:id` route with
`id = 'mine'`. `Contribution.campaign_id` is an `ObjectId`, so the cast throws a 500 that the
`.catch(() => ({ data: { contributions: [] } }))` swallows. The real route
(`GET /api/contributions/campaign/:id`) also returns an array, not `{ contributions }`, so the
response shape is wrong even when the id is valid.

**What to do**

1. Either add a `GET /api/contributions/mine/pending` (or creator-scoped stats) route on the
   server, or fetch `/api/campaigns/mine` and aggregate the counts from `GET /api/contributions/campaign/:id`
   per campaign.
2. Normalise the response shape you read (`array` vs `{ contributions }`) so the two cannot drift.
3. Verify the badge on the creator dashboard against seeded pending contributions.

---

## 5. Mobile dashboard drawer is not a dialog

**File:** `client/components/DashboardSidebar.jsx:187-195`
**Impact:** Keyboard and screen-reader users cannot dismiss the mobile nav.

The drawer is a bare `<aside>` inside a `fixed inset-0` overlay; the only close path is a
backdrop click. It has no `role="dialog"`, no `aria-modal`, no Escape handler, no focus move,
and no visible close button. `components/ui/Modal.jsx` already implements all of these.

**What to do**

1. Add `role="dialog"`, `aria-modal="true"`, and `aria-label="Dashboard navigation"` to the
   drawer `<aside>`; keep `aria-hidden="true"` on the backdrop.
2. Add a `useEffect` that registers `keydown` → `onClose()` on Escape and removes the listener
   on cleanup, gated on the mobile-open state so the desktop rail never carries a listener.
3. Add a visible close button (`aria-label="Close navigation"`) inside the drawer, `lg:hidden`.
4. Move focus to the drawer on open (`tabIndex={-1}` plus a ref) and restore it on close.
5. Confirm the desktop `<aside className="hidden lg:flex ...">` at `DashboardSidebar.jsx:183-185`
   stays untouched.
6. Run `cd client && npm run lint`.

---

## 6. Failed loads render as the empty state

**Files (11 sites):**

- `client/app/campaigns/page.jsx:21`
- `client/app/dashboard/manage-campaigns/page.jsx:19`
- `client/app/dashboard/my-campaigns/page.jsx:30`
- `client/app/dashboard/withdrawals/page.jsx:27`
- `client/app/dashboard/reports/page.jsx:15`
- `client/app/dashboard/creator-payment-history/page.jsx:14`
- `client/app/dashboard/layout.jsx:32`
- `client/app/dashboard/payment-history/page.jsx:14`
- `client/app/dashboard/withdrawal-requests/page.jsx:15`
- `client/app/dashboard/manage-users/page.jsx:27`
- `client/app/dashboard/campaign-approvals/page.jsx:17`

**Impact:** A network failure is indistinguishable from "no data". For example,
`reports/page.jsx` prints "No reports — platform looks clean!" when the request fails.

Each handler ends in a bare `catch(() => {})`, then `finally(() => setLoading(false))`, so the
empty branch renders on error.

**What to do**

1. Add an `error` state and a `retry` to each page, using the `reloadToken` idiom from
   `contributions-review/page.jsx:19-21` so `setState` runs only after an `await` (a synchronous
   setState would add a `react-hooks/set-state-in-effect` lint error).
2. Render the existing banner pattern from `supporter-home/page.jsx:60-65`:

```jsx
{error && (
  <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-error bg-error-light px-4 py-3 text-sm text-error">
    <span>We couldn’t load your data.</span>
    <Button variant="ghost" size="sm" onClick={retry}>Retry</Button>
  </div>
)}
```

3. When `error` is true, do not render the empty state or the "0 items" count, so the two cannot
   contradict each other.
4. Check the lint and build gates after each page: `cd client && npm run lint && npm run build`.

---

## Resolution (2026-10-19)

All six issues fixed with test-first changes on the server and lint-verified client edits.

| # | Issue | Change | Proof |
|---|-------|--------|-------|
| 1 | Pending credits stranded on campaign delete | `server/lib/campaignLifecycle.js` now selects and guards `status: { $in: ['approved', 'pending'] }` | `server/tests/campaignDeleteRefund.test.js` (new, 4 cases); watched RED before the fix |
| 2 | Admin dashboard stats always 0 | `client/app/dashboard/admin-home/page.jsx` reads `/api/dashboard/counts`; `server/routes/payments.js` returns `totalVolume` from a `$sum` aggregation | `server/tests/payments.test.js` (new, 4 cases); watched RED before the fix |
| 3 | Mark-all-read no-op, badge never clears | `server/models/Notification.js` gains `read: { type: Boolean, default: false }` | `server/tests/notifications.test.js` (new, 2 cases); watched RED before the fix |
| 4 | Creator pending count always 0 | `client/app/dashboard/creator-home/page.jsx` reads `pendingContributions` from `/api/dashboard/counts` | eslint clean on the file |
| 5 | Mobile drawer not a dialog | `client/components/DashboardSidebar.jsx` gains `role="dialog"`, `aria-modal`, Escape handler gated on the mobile state, focus move/restore, and a 44px close button | eslint clean; desktop rail verified untouched |
| 6 | Failed loads render as empty state | 11 pages gain an `error` state, the supporter-home `role="alert"` banner, and a `retry`; `layout.jsx` logs instead of swallowing | eslint clean on all touched files |

Test doubles in `server/tests/campaigns.test.js` and `server/tests/security.test.js` were updated to match the `$in` filter the refund service now uses.

Gates after the fixes:

- `cd server && npm test` -> 141 passed, 15 suites (was 131; +10 new tests)
- `cd client && npm run lint` -> 19 problems (4 errors, 15 warnings), unchanged from baseline
- `cd client && npm run build` -> 25/25 static pages

All three low-confidence follow-ups below the threshold have since been fixed test-first — the
public `GET /api/campaigns/:id`, the dead `FileInput` drop path, and the non-persistent report
dismiss each failed a new test before its fix (server 152/152 across 16 suites; a new
`node --test` runner in `client/`, 3/3). The deferred audit items in
`docs/superpowers/plans/2026-10-19-audit-findings.md` are still open.

## Notes

- These six are the issues that cleared the confidence threshold. Lower-confidence items were
  filtered out (for example the public `GET /api/campaigns/:id`, the dead `FileInput` drop path,
  and the non-persistent report dismiss all scored below 80 but are still worth a follow-up).
- The repo's own deferred audit findings (mobile drawer was later scheduled as Task 3; touch
  targets, payment-history mobile tables, `limit=1000`, dead dependencies) are tracked in
  `docs/superpowers/plans/2026-10-19-audit-findings.md` and were not re-reported here.
- No GitHub comment was posted: `gh` is not installed in this environment and the repository has
  no pull request for this branch.
