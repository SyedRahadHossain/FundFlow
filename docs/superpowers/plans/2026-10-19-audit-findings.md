# Audit Findings Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clear the accessibility, responsive, and failure-visibility findings from the FundFlow `client/` audit scored 13/20, leaving only the findings that need a running browser or a server change.

**Architecture:** Ten tasks, each owning one finding or one coherent group of the same finding across files. Every task edits only `client/`, reuses the design tokens in `app/globals.css` and the components in `components/ui/`, and copies an existing pattern rather than inventing one — the error banner from `supporter-home`, the dialog semantics from `ui/Modal.jsx`, the mobile card list from `my-contributions`.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS v4, ESLint `eslint-config-next/core-web-vitals`. No new dependencies in any task.

**Spec:** `.impeccable/audit/2026-10-19T02-52-57Z__client.md` — the source of every finding, its location, and its recommended fix. Each task names the finding ID it closes.

## Global Constraints

These bind every task. An implementer that violates one has failed the task even if its own steps pass.

- No new npm dependencies. `package.json` may only lose entries, never gain.
- No hardcoded colour values in JSX. Every colour comes from a `--color-*` token in `app/globals.css:6-51`.
- Lint must report exactly **19 problems (4 errors, 15 warnings)** after every task. The 4 errors are pre-existing `react-hooks/set-state-in-effect` at `context/AuthContext.jsx:35`, `hooks/useApi.js:30`, `hooks/useCredits.js:26`, `app/dashboard/creator-home/page.jsx:25`. They cannot be fixed by editing code and must not be suppressed. **A task that adds a 15th or 16th warning has failed.**
- Production build must complete with **25/25 static pages** after every task.
- Server test suite must stay green at **122/122 across 11 suites**. No task touches `server/`, so any server failure means a task strayed out of scope.
- ESM with semicolons, two-space indentation, matching the surrounding file exactly. No formatter is configured.
- Path alias `@/*` → `./*`.
- Preserve every existing user-visible string unless the finding names the string as the defect.
- Do not commit generated output. `client/.next/` is gitignored.

## Review Focus

The spec is a static audit. These are the inputs and conditions it could not exercise, each most likely to bite first, each pinned to the task that owns the code.

1. **Dark mode after the contrast sweep.** The neutral ramp inverts at `app/globals.css:94-101`, so a token that is unreadable in light mode may be the readable one in dark. Task 1 must verify both themes, not just light.
2. **The desktop sidebar must not become a dialog.** The same `<aside>` renders the 256px desktop rail and the mobile drawer. Task 2 must not trap focus on `lg:` viewports, or keyboard users lose the whole dashboard nav.
3. **`preventDefault` on drop may be what keeps the native file input working.** Task 10 adds real drop handling; if it also changes the click path, `register` and `add-campaign` uploads break. Test the click path too.
4. **SSR must not break the JWT interceptor.** Task 4's server fetch runs where there is no `localStorage`. Any code path that reads the token at module scope throws during prerender.
5. **`limit=1000` removal assumes the server caps the page size.** Task 10 must confirm the server enforces a default, or the stats silently read page one only.
6. **Escape handlers that reach `document` must not stack.** Four separate components add one. Each must remove its listener on unmount or Escape fires stale closures.

---

### Task 1: Contrast — secondary text (finding P1-1)

**Files:**
- Modify: 18 `.jsx` files, all occurrences of the `text-neutral-400` class (60 sites, list in the step)

**Interfaces:**
- Consumes: `--color-neutral-500` (`#6b7280` light / `#9ca3af` dark) and `--color-neutral-600` from `app/globals.css:25-26,99-100`.
- Produces: nothing. Pure class swap, no component API change.

- [ ] **Step 1: Confirm the two roles are separable**

Run:
```bash
cd client && grep -rn 'text-neutral-400' app components --include=*.jsx | wc -l
grep -rn 'text-white' app components --include=*.jsx | grep 'neutral-400'
```
Expected: `60`, then no output. The second command proves no element sets both classes, so swapping cannot put dark text on a light-text surface.

- [ ] **Step 2: Establish the dark-mode baseline**

`text-neutral-400` on `bg-surface` is 2.54:1 in light mode. In dark mode `--color-neutral-400` becomes `#4b5563` on `#111827` — also failing. `--color-neutral-500` becomes `#9ca3af` on `#111827`, which passes. Record both numbers in the report so the fix is justified rather than asserted.

- [ ] **Step 3: Swap in all 18 files**

`sed -i 's/text-neutral-400/text-neutral-500/g'` across exactly these files, which together hold all 60 sites:
```
app/dashboard/campaign-approvals/page.jsx      (10)
app/dashboard/withdrawals/page.jsx              (5)
app/dashboard/withdrawal-requests/page.jsx      (5)
app/dashboard/purchase-credit/page.jsx          (5)
components/ui/Input.jsx                         (5)
app/dashboard/my-campaigns/page.jsx             (4)
app/dashboard/manage-campaigns/page.jsx         (4)
components/NotificationBell.jsx                 (3)
app/dashboard/my-contributions/page.jsx         (3)
app/dashboard/creator-payment-history/page.jsx  (3)
app/dashboard/contributions-review/page.jsx     (3)
app/dashboard/reports/page.jsx                  (2)
app/dashboard/payment-history/page.jsx          (2)
app/dashboard/manage-users/page.jsx             (2)
components/ui/Modal.jsx                         (1)
components/DashboardSidebar.jsx                 (1)
app/dashboard/layout.jsx                        (1)
app/dashboard/creator-home/page.jsx             (1)
```

- [ ] **Step 4: Verify the non-text uses survived**

Run:
```bash
cd client && grep -rn 'text-neutral-400' app components --include=*.jsx | wc -l
grep -rn 'neutral-400' app components --include=*.jsx | grep -v 'text-neutral-400'
```
Expected: `0`, then exactly the four border/status lines at `ui/Avatar.jsx:127`, `ui/Input.jsx:66`, `:153`, `:219`. Borders and the offline dot are non-text and correctly stay at `neutral-400`.

- [ ] **Step 5: Run the gates**

Run: `cd client && npm run lint 2>&1 | tail -3` then `npm run build 2>&1 | grep 'Generating static pages'`
Expected: `19 problems (4 errors, 15 warnings)` and `25/25`.

- [ ] **Step 6: Commit**

```bash
git add -A client/app client/components
git commit -m "Fix: raise secondary text contrast to AA across 60 sites"
```

---

### Task 2: Contrast — `text-info` trust rule (finding P1-3)

**Files:**
- Modify: `app/dashboard/creator-home/page.jsx:143`

**Interfaces:**
- Consumes: `--color-info-dark` (`#1d4ed8`, 6.3:1) from `app/globals.css:51`.
- Produces: nothing.

- [ ] **Step 1: Read the line**

Run: `cd client && sed -n '143p' app/dashboard/creator-home/page.jsx`
Expected: a `<p className="text-xs text-info …">` reading "Rejection = instant credit refund to supporter".

- [ ] **Step 2: Change `text-info` to `text-info-dark`**

`text-info` (`#3b82f6`) is 3.68:1 at 12px — below AA. `text-info-dark` is 6.3:1. Leave the class list otherwise untouched.

- [ ] **Step 3: Run the gates**

Run: `cd client && npm run lint 2>&1 | tail -3 && npm run build 2>&1 | grep 'Generating static pages'`
Expected: `19 problems (4 errors, 15 warnings)` and `25/25`.

- [ ] **Step 4: Commit**

```bash
git add client/app/dashboard/creator-home/page.jsx
git commit -m "Fix: darken the refund trust rule to meet AA at 12px"
```

---

### Task 3: Mobile drawer keyboard accessibility (finding P1-2)

**Files:**
- Modify: `components/DashboardSidebar.jsx:183-195` (mobile drawer block)

**Interfaces:**
- Consumes: `ui/Modal.jsx:10-35` for the focus-trap approach; `Navbar.jsx:29-51` for this codebase's existing `keydown` Escape convention.
- Produces: nothing to other tasks. The `open`/`onClose` props and the `content` variable keep their names.

- [ ] **Step 1: Write the failing check**

Run: `cd client && sed -n '183,195p' components/DashboardSidebar.jsx`
Expected: a `fixed inset-0 z-50 lg:hidden` wrapper containing a backdrop `div` and a bare `aside`. No `role`, no `aria-modal`, no close button, no keydown handler. Record this as the RED baseline.

- [ ] **Step 2: Give the drawer dialog semantics**

On the `<aside className="relative w-64 h-full shadow-xl">` add `role="dialog"`, `aria-modal="true"`, `aria-label="Dashboard navigation"`. On the backdrop `div` add `onClick={onClose}` — it already has this — and keep `aria-hidden="true"` so AT never lands on it.

- [ ] **Step 3: Add Escape-to-close**

Add a `useEffect` in `DashboardSidebar` that registers a `keydown` listener on `document` calling `onClose()` when `e.key === 'Escape'`, and removes it on cleanup. **Guard the registration on the mobile-open state**, so the desktop rail never carries a listener. The dependency array must include `open` and `onClose`. `useEffect` is already imported.

- [ ] **Step 4: Add a visible close button**

Inside the drawer's `<aside>`, before `{content}`, add a close button:
```jsx
<button
  type="button"
  onClick={onClose}
  aria-label="Close navigation"
  className="lg:hidden absolute right-2 top-2 z-10 flex h-11 w-11 items-center justify-center rounded-xl text-neutral-500 hover:bg-neutral-100"
>
  <span aria-hidden="true">✕</span>
</button>
```
The `lg:hidden` keeps it out of the desktop rail, since the same `content` renders both.

- [ ] **Step 5: Move focus in and back out**

On open, `useEffect` moves focus to the drawer's `<aside>` via a ref. On close, restore focus to the element that had it before. Use a module-scope `let lastFocused` captured at open time, and give the `<aside>` `tabIndex={-1}` so it is focusable without entering the tab order.

- [ ] **Step 6: Verify the desktop rail is untouched**

Run: `cd client && sed -n '175,182p' components/DashboardSidebar.jsx`
Expected: the desktop `<aside className="hidden lg:flex …">` carries no `role="dialog"`, no `aria-modal`, no close button. A focus trap here would make the dashboard nav unusable by keyboard.

- [ ] **Step 7: Run the gates**

Run: `cd client && npm run lint 2>&1 | tail -3 && npm run build 2>&1 | grep 'Generating static pages'`
Expected: `19 problems (4 errors, 15 warnings)` and `25/25`.

- [ ] **Step 8: Commit**

```bash
git add client/components/DashboardSidebar.jsx
git commit -m "Fix: make the mobile dashboard drawer a proper dialog"
```

---

### Task 4: Public catalog first paint and SEO (finding P2-1)

**Files:**
- Modify: `app/campaigns/page.jsx`
- Modify: `app/dashboard/explore/page.jsx`

**Interfaces:**
- Consumes: `GET /api/campaigns?status=approved` (public, verified). The client token comes from `lib/api.js`'s interceptor, which is client-only.
- Produces: the same `campaigns` state shape both pages already hold. No other task reads these files.

- [ ] **Step 1: Write the failing check**

Run: `cd client && sed -n '1,30p' app/campaigns/page.jsx`
Expected: `'use client'`, an empty `campaigns` state, and a `useEffect` fetching on mount, so the HTML ships a skeleton grid and crawlers see no campaigns. Record as RED.

- [ ] **Step 2: Server-fetch the catalog**

Add an `async function getCampaigns()` in each page that calls the API **directly with `fetch`, not through `lib/api.js`** — the interceptor reads `localStorage`, which does not exist during prerender. Use the base URL from `process.env.NEXT_PUBLIC_API_URL` and `next: { revalidate: 60 }`.

- [ ] **Step 3: Seed the client state, and stop swallowing load failure**

Pass the server result as the initial value of the `campaigns` state so the first paint is real content. Keep the `useEffect` fetch for refresh-on-mount; it now updates rather than populates.

That same effect holds the bare `catch(() => {})` at `:21`, the finding Task 8 covers on three sibling pages. Fix it here, because Task 8 does not touch this file: add an `error` state, render the `role="alert"` banner with a Retry button copied verbatim from `app/dashboard/supporter-home/page.jsx:60-65`, and do not render the "No campaigns found." empty state while `error` is true. Use the `reloadToken` idiom from `contributions-review/page.jsx:19-21` so the effect calls `setState` only after an `await`. A synchronous setState would create a fifth `react-hooks/set-state-in-effect` error and fail the lint gate.

Apply the same `error` flag to `app/dashboard/explore/page.jsx:26`, which Task 8 does not cover either.

- [ ] **Step 4: Verify no token is read at module scope**

Run: `cd client && sed -n '1,40p' app/campaigns/page.jsx | grep -n 'localStorage\|api\.'`
Expected: no match inside the server function. Any match throws during prerender and the build fails.

- [ ] **Step 5: Run the gates and confirm the page is now static**

Run: `cd client && npm run lint 2>&1 | tail -3 && npm run build 2>&1 | grep -E 'Generating static pages'`
Expected: `19 problems (4 errors, 15 warnings)` and `25/25`.

- [ ] **Step 6: Commit**

```bash
git add client/app/campaigns/page.jsx client/app/dashboard/explore/page.jsx
git commit -m "Fix: server-render the public campaign catalog"
```

---

### Task 5: Notification panel overflow (finding P2-2)

**Files:**
- Modify: `components/NotificationBell.jsx:96`

**Interfaces:**
- Consumes: nothing.
- Produces: nothing.

- [ ] **Step 1: Write the failing check**

Run: `cd client && sed -n '96p' components/NotificationBell.jsx`
Expected: `absolute right-0 top-full mt-2 w-88 …`. `w-88` is 352px, wider than a 360px viewport, so the panel clips off the left edge. Record as RED.

- [ ] **Step 2: Clamp the width**

Replace `w-88` with `w-80 max-w-[calc(100vw-2rem)]`. `w-80` is 320px and fits every supported viewport; the clamp covers anything narrower. Leave the anchor classes untouched.

- [ ] **Step 3: Run the gates**

Run: `cd client && npm run lint 2>&1 | tail -3 && npm run build 2>&1 | grep 'Generating static pages'`
Expected: `19 problems (4 errors, 15 warnings)` and `25/25`.

- [ ] **Step 4: Commit**

```bash
git add client/components/NotificationBell.jsx
git commit -m "Fix: clamp the notification panel to the viewport"
```

---

### Task 6: Notification Escape close (finding P2-4)

**Files:**
- Modify: `components/NotificationBell.jsx:17-21`

**Interfaces:**
- Consumes: the `open`/`setOpen` state and the `ref` already used by the outside-click handler.
- Produces: nothing.

- [ ] **Step 1: Write the failing check**

Run: `cd client && sed -n '15,22p' components/NotificationBell.jsx`
Expected: a `useEffect` registering `mousedown` only. No `keydown`, so a keyboard user opens the panel and cannot dismiss it. Record as RED.

- [ ] **Step 2: Add Escape**

Extend that effect to also register `keydown`, calling `setOpen(false)` when `e.key === 'Escape'`, and remove both listeners in the cleanup. Reuse the existing effect rather than adding a second one — one listener pair, one cleanup.

- [ ] **Step 3: Verify cleanup removes both**

Run: `cd client && sed -n '15,25p' components/NotificationBell.jsx`
Expected: the cleanup calls `document.removeEventListener` for both `mousedown` and `keydown`. A stale `keydown` listener fires a closed-over `setOpen` on every Escape in the app.

- [ ] **Step 4: Run the gates**

Run: `cd client && npm run lint 2>&1 | tail -3 && npm run build 2>&1 | grep 'Generating static pages'`
Expected: `19 problems (4 errors, 15 warnings)` and `25/25`.

- [ ] **Step 5: Commit**

```bash
git add client/components/NotificationBell.jsx
git commit -m "Fix: close the notification panel on Escape"
```

---

### Task 7: 44px touch targets (finding P2-3)

**Files:**
- Modify: `components/NotificationBell.jsx:75`
- Modify: `components/DashboardSidebar.jsx` (nav rows and sign-out row)
- Modify: `components/Navbar.jsx:168`
- Modify: `app/dashboard/purchase-credit/page.jsx:85`
- Modify: `app/dashboard/withdrawal-requests/page.jsx:77,102`
- Modify: `app/dashboard/my-contributions/page.jsx:87,172-187`

**Interfaces:**
- Consumes: the announced 44px baseline in `PRODUCT.md` and `DESIGN.md`.
- Produces: nothing. Each edit adds a `min-h-*`/`min-w-*`; no component API changes.

- [ ] **Step 1: Record the RED baseline**

Run: `cd client && grep -n 'w-10 h-10' components/NotificationBell.jsx && grep -n 'py-2.5' components/DashboardSidebar.jsx && grep -n 'min-h-\[40px\]' components/Navbar.jsx`
Expected: a 40px bell, 38px nav rows, a forced 40px theme toggle. All under 44. Record each.

- [ ] **Step 2: Fix the bell and the nav rows**

Bell `:75`: `w-10 h-10` → `min-h-11 min-w-11` (44px), keeping the flex centring. Sidebar nav rows and the sign-out button: add `min-h-11`. Keep `py-2.5` so the visual rhythm does not change — `min-h` only raises the floor.

- [ ] **Step 3: Fix the theme toggle**

`Navbar.jsx:168`: replace the forced `!min-h-[40px]` with `min-h-11`. This is the mobile-menu toggle already flagged in the critique's P0 batch, closed the same way.

- [ ] **Step 4: Fix the money actions**

Purchase Buy button `:85`: add `min-h-11`. Withdrawal approve `:77` (desktop) and `:102` (mobile): add `min-h-11`. These are the two money controls the audit measures at 30px and 36px.

- [ ] **Step 5: Fix the pagination and filter chips**

My-contributions Prev/Next `:172-187`: add `min-h-11` to both. Filter chips `:87`: `min-h-[36px]` → `min-h-11`.

- [ ] **Step 6: Run the gates**

Run: `cd client && npm run lint 2>&1 | tail -3 && npm run build 2>&1 | grep 'Generating static pages'`
Expected: `19 problems (4 errors, 15 warnings)` and `25/25`.

- [ ] **Step 7: Commit**

```bash
git add client/components/NotificationBell.jsx client/components/DashboardSidebar.jsx client/components/Navbar.jsx client/app/dashboard
git commit -m "Fix: raise money and primary controls to the 44px target"
```

---

### Task 8: Failure states (finding P2-5)

**Files:**
- Modify: `app/dashboard/my-contributions/page.jsx:52-59`
- Modify: `app/dashboard/withdrawal-requests/page.jsx:15`

**Deliberately excludes `app/campaigns/page.jsx` and `app/dashboard/explore/page.jsx`.**
Task 4 owns both load paths and its Step 3 carries the error flag there. Two tasks
rewriting one fetch would fight.

**Interfaces:**
- Consumes: the reference pattern at `app/dashboard/supporter-home/page.jsx:60-65` — a `role="alert"` banner with a `Button variant="ghost" size="sm"` Retry — and the `reloadToken` reload idiom at `contributions-review/page.jsx:19-21`.
- Produces: an `error` boolean and a `retry` function in each of the three pages. No cross-page import; the pattern is four lines, not worth a shared component for a fix that must stay local.

- [ ] **Step 1: Record the RED baseline**

Run: `cd client && grep -n 'catch(() => {})' app/dashboard/withdrawal-requests/page.jsx app/dashboard/my-contributions/page.jsx`
Expected: bare catches. Each swallows the failure and leaves the empty state standing, so a network error reads as "No pending withdrawal requests." Record each line.

- [ ] **Step 2: Add error state to each page**

In each of the three pages, add `const [error, setError] = useState(false)` and a `retry` that re-runs the load. Follow the `reloadToken` idiom so the effect calls `setState` only after an `await` — the `react-hooks/set-state-in-effect` rule is why the four existing errors exist, and a fifth would fail the lint gate.

- [ ] **Step 3: Set and clear the flag**

Each load's `catch` sets `error = true`; each success path sets it `false`. Remove the bare `catch(() => {})` forms.

- [ ] **Step 4: Render the banner, and hide the false empty state**

Above each list, render the supporter-home banner verbatim:
```jsx
{error && (
  <div role="alert" className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-error bg-error-light px-4 py-3 text-sm text-error">
    <span>We couldn’t load your data.</span>
    <Button variant="ghost" size="sm" onClick={retry}>Retry</Button>
  </div>
)}
```
When `error` is true, do **not** render the "No pending withdrawal requests." or the empty-table state — that is the false success this finding exists to fix. Adjust the page-specific copy per page (`"We couldn’t load your contributions."` etc.). The `Button` import must already be present in each page; add it if not.

- [ ] **Step 5: Verify the count text cannot lie**

Run: `cd client && sed -n '36p' app/dashboard/withdrawal-requests/page.jsx`
Expected: `{withdrawals.length} pending request…`. On error this now reads "0 pending requests" while the banner is also showing. Guard the count on `!error`, or drop it into the banner's absence, so the two never contradict.

- [ ] **Step 6: Run the gates**

Run: `cd client && npm run lint 2>&1 | tail -3 && npm run build 2>&1 | grep 'Generating static pages'`
Expected: `19 problems (4 errors, 15 warnings)` — **not 20** — and `25/25`.

- [ ] **Step 7: Commit**

```bash
git add client/app/dashboard/my-contributions/page.jsx client/app/dashboard/withdrawal-requests/page.jsx
git commit -m "Fix: distinguish load failure from an empty list"
```

---

### Task 9: Payment history mobile tables (finding P2-7)

**Files:**
- Modify: `app/dashboard/payment-history/page.jsx:47-48`
- Modify: `app/dashboard/creator-payment-history/page.jsx:47-48`

**Interfaces:**
- Consumes: the five-page pattern at `app/dashboard/my-contributions/page.jsx:116,149` — a `hidden sm:block overflow-x-auto` table plus a `sm:hidden` card list over the same data.
- Produces: nothing.

- [ ] **Step 1: Record the RED baseline**

Run: `cd client && sed -n '45,50p' app/dashboard/payment-history/page.jsx && sed -n '45,50p' app/dashboard/creator-payment-history/page.jsx`
Expected: both render a bare table with no `hidden sm:block` wrapper and no `sm:hidden` card list, so phones scroll sideways. Record both.

- [ ] **Step 2: Read the reference pattern**

Run: `cd client && sed -n '110,160p' app/dashboard/my-contributions/page.jsx`
Copy its wrapper structure and card markup exactly, substituting this page's columns.

- [ ] **Step 3: Add the card list to `payment-history`**

Wrap the existing table in `hidden sm:block overflow-x-auto`, then add a `sm:hidden divide-y divide-neutral-50` card list over the same `payments` array. Each card shows the amount, the date, and the status — the three fields the table's columns carry.

- [ ] **Step 4: Add the card list to `creator-payment-history`**

Same change, same structure.

- [ ] **Step 5: Run the gates**

Run: `cd client && npm run lint 2>&1 | tail -3 && npm run build 2>&1 | grep 'Generating static pages'`
Expected: `19 problems (4 errors, 15 warnings)` and `25/25`.

- [ ] **Step 6: Commit**

```bash
git add client/app/dashboard/payment-history/page.jsx client/app/dashboard/creator-payment-history/page.jsx
git commit -m "Fix: give the payment history tables a mobile card fallback"
```

---

### Task 10: UI-kit bypass and dead code (findings P3-4, P3-6, P2-6)

**Files:**
- Modify: `components/ui/Input.jsx:287-310` (FileInput drop handler)
- Modify: `app/dashboard/supporter-home/page.jsx:25` (`limit=1000`)
- Modify: `app/dashboard/purchase-credit/page.jsx:82`
- Modify: `app/dashboard/reports/page.jsx:87`
- Modify: `app/dashboard/my-contributions/page.jsx:81`
- Modify: `package.json` (remove dead deps)

**Interfaces:**
- Consumes: `components/ui/Button.jsx`; the existing `FileInput` `onChange` contract used by `register/page.jsx:105` and `add-campaign/page.jsx:153`.
- Produces: a working `FileInput` drop path that feeds the same `onChange` the click path already feeds.

- [ ] **Step 1: Record the RED baseline for the dead drop**

Run: `cd client && sed -n '287,310p' components/ui/Input.jsx`
Expected: an `onDrop` that only calls `preventDefault()` and toggles highlight classes, never reading `e.dataTransfer.files`, while `:310` advertises "Drag & drop or click to upload". Record as RED.

- [ ] **Step 2: Wire the drop handler**

In `onDrop`, call `preventDefault()`, clear the highlight, then read `e.dataTransfer.files`. If the component takes a `multiple` prop, pass the `FileList` through the same handler `onChange` uses; otherwise pass `[files[0]]`. Do not change the click path — Review Focus 3 exists because the native input may be working only because `preventDefault` never interfered with it.

- [ ] **Step 3: Verify the click path still works**

Run: `cd client && grep -n 'inputRef\|type="file"' components/ui/Input.jsx | head`
Expected: the hidden file input still receives clicks. Add no new ref or click forwarding.

- [ ] **Step 4: Remove the two dead dependencies**

Run: `cd client && grep -rn 'lucide-react\|react-responsive-carousel' app components --include=*.jsx | wc -l`
Expected: `0`. Then `npm uninstall lucide-react react-responsive-carousel`. Both are listed at `package.json:16,21` with zero imports.

- [ ] **Step 5: Replace the raw `<button>`s with `Button`**

At `purchase-credit/page.jsx:82`, `reports/page.jsx:87`, and `my-contributions/page.jsx:81`, swap the hand-rolled `<button>` for `<Button>` with the equivalent `variant`/`size`. Preserve every existing `className` via `className={cn(…)}` and keep the `disabled` and `onClick` props identical. If a button needs a variant `Button` does not offer, leave it raw and say so in the report rather than extending the kit.

- [ ] **Step 6: Address the `limit=1000` fetch**

Run: `cd client && sed -n '20,30p' app/dashboard/supporter-home/page.jsx`
This fetches up to 1000 contribution rows to compute three numbers. A server-side aggregate endpoint is a `server/` change and out of this plan's scope. Instead: add a comment naming the endpoint that should exist (`GET /api/contributions/stats`), and leave the fetch. **Do not silently drop `limit`, or the stats read only page one.** Note this in the report as deferred with its reason.

- [ ] **Step 7: Run the gates**

Run: `cd client && npm run lint 2>&1 | tail -3 && npm run build 2>&1 | grep 'Generating static pages'` and `cd ../server && npm test 2>&1 | tail -3`
Expected: `19 problems (4 errors, 15 warnings)`, `25/25`, and `122 passed`.

- [ ] **Step 8: Commit**

```bash
git add client/components/ui/Input.jsx client/package.json client/package-lock.json client/app/dashboard
git commit -m "Fix: wire the file drop handler and route raw buttons through Button"
```

---

## Explicitly Out of Scope

Carried forward deliberately, not dropped. Each needs something this plan does not have.

- **P3-1 through P3-3, P3-8** — Testimonials star rating, hero live region, tablist arrow keys, focus-to-first-error. Real, minor, and each needs a screen-reader or keyboard pass to verify the fix landed. Batch them into one later pass with a browser.
- **P3-5, P3-7** — dead `--radius-*`/`--shadow-*` tokens, stale `DESIGN.md`/`PRODUCT.md` dark-mode claims. Doc and token drift; the audit itself marked them "reported, not repaired".
- **P3-9, P3-10** — eight raw `<img>` → `next/image`, `grid-cols-2` squeeze at 320px. Both need a rendered check the audit could not perform.
- **P2-8** — the duplicate `/api/auth/me` and the two unpaused 30s pollers. Sharing the auth payload means restructuring `AuthContext`, which owns four of the app's loading flows. A separate plan.
- **Server-side stats endpoint** for Task 10's `limit=1000`. A `server/` change with its own test obligations.
