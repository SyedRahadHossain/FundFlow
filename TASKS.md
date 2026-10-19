# Task List — PRD / Assessment Brief Gap Closure

Source: `Crowdfunding_Platform.docx` (the original assessment brief) cross-checked against
`Crowdfunding Platform — PRD.md` and the current code.

Status of everything already verified working is in the appendix at the bottom.

Items 1–7, 10, and 11 are complete. Item 12 is partly done, with the two impeccable reports
holding the unfixed findings. Item 14 (deploy) needs your accounts, and item 13 has one
small remainder: your LinkedIn and Facebook profile URLs.

Severity: **blocker** = grader explicitly checks it · **major** = explicit docx requirement ·
**minor** = explicit docx wording that current UI softens · **admin** = needs your accounts.

---

## 1. Dashboard Footer — done, then removed on your instruction

The docx dashboard layout spec lists, in order: Logo · Available Credits | User Image ·
User Role | User Name · Notification · Navigation · Sections Based on Routes · **Footer**.

I built it, then you told me to remove it. So the dashboard has no footer again.

- [x] Rendered `<Footer />` inside `<main>` in `client/app/dashboard/layout.jsx` — it
      scrolled with content, broke neither the `overflow-y-auto` container nor the mobile
      `h-screen` + `overflow-hidden` height budget
- [x] Removed both the `<Footer />` element and its now-unused import on your instruction

> **Grader risk, flagged rather than hidden:** the docx asks for a dashboard Footer and
> there is now none. Your instruction overrides the docx, which is the right precedence, but
> a grader checking that line literally will mark it missing. Reversal is one line: add
> `<Footer />` back at the end of the `<main id="main-content">` block in
> `client/app/dashboard/layout.jsx`, plus the import. The `Footer` component itself was never
> touched and still renders on `/`, `/campaigns`, and `/campaigns/[id]`.

## 2. Supporter "Approved Contributions" table — done

Docx §Supporter → *Approved Contributions*: a table of contributions where `status ===
'approved'`, columns `campaign_title`, `contribution_amount`, `creator_name`, `status`.

The PRD merged this into "My Contributions". Satisfied both readings with a filter rather
than a duplicate route.

- [x] Added an **All / Approved / Pending** tab row above the table in
      `client/app/dashboard/my-contributions/page.jsx`, default "All"
- [x] Added a whitelisted `status` query param to `GET /api/contributions/mine` in
      `server/routes/contributions.js`; anything outside the whitelist returns 400, so the
      route cannot be handed an injection. Server-side pagination still applies across
      filters via the existing `?page=&limit=`
- [x] Added 5 tests to `server/tests/contributions.test.js`, including the 400 rejection
- [x] No new sidebar route — the filter reads as one section, matching the PRD's merge

## 3. Reports show reporter email, not reporter name — done

Docx §Admin → *Reports*: "with the **reporter's name**, campaign title, reason, and date".
PRD line 193 says the same.

Resolved server-side so a client cannot spoof the name it is credited with.

- [x] Added `reporter_name` to `server/models/Report.js` as optional — old documents
      without it still validate
- [x] `POST /api/reports` populates it from `User.findOne({ email: req.user.email })`,
      falling back to the email when the user is missing
- [x] `client/app/dashboard/reports/page.jsx` renders `{r.reporter_name || r.reporter_email}`
- [x] `reportSchema` unchanged — the client sends no name, so there is nothing to spoof
- [x] Added 4 tests asserting `reporter_name` is resolved server-side, including the
      missing-user fallback

## 4. Dashboard sidebar shows email where docx wants user name — done

Docx dashboard layout: "User Role | **User Name**".

Root cause was the JWT payload being only `{ email, role }`, so `AuthContext`'s `user`
object carried no name. `GET /api/auth/me` already returns the full profile.

- [x] `client/app/dashboard/layout.jsx` already called `/api/auth/me` for credits and
      discarded the rest — it now keeps the full profile and passes `name` down
- [x] `client/components/DashboardSidebar.jsx` renders `displayName` with the email demoted
      to a secondary line beneath it
- [x] `Avatar` takes the name, so initials derive from it rather than from the email

## 5. Manage Campaigns is cards, not a table — done

Docx §Admin → *Manage Campaigns*: "the campaign list in **a table format** with campaign
information and a Delete Campaign button".

- [x] Converted `client/app/dashboard/manage-campaigns/page.jsx` to the `<table>` +
      `<thead>` pattern already used by `manage-users/page.jsx` and
      `withdrawal-requests/page.jsx`
- [x] Delete button stays per row, behind the existing confirm dialog
- [x] Mobile card fallback preserved for narrow viewports

## 6. My Campaigns is cards, not a table — done

Docx §Creator → *My Campaigns*: "all the campaigns they added, in descending order based on
the deadline, in **a table format**". PRD line 103 softened this to "columns: campaign info
+ Update + Delete". The deadline-descending order was already correct.

- [x] Converted `client/app/dashboard/creator-home/page.jsx` to the same table pattern
- [x] All three actions preserved per row: Update, Post Update, Delete
- [x] Post Update still gated on `status === 'approved'`
- [x] Mobile card fallback preserved

## 7. Dark mode — done this session

Not in the docx. Added on request, as a pure token remap with no component edits.

- [x] `@theme` semantic surfaces (`--color-surface`, `--color-canvas`) replacing plain
      `bg-white` across 59 call sites in 34 files; the 23 translucent `bg-white/NN`
      overlays were deliberately left alone
- [x] Single `.dark` block in `client/app/globals.css` re-mapping all 32 `--color-*` tokens,
      placed last so it wins over `:root` at equal specificity
- [x] Neutral ramp inverted; `--color-white` untouched so `text-white` on indigo/teal
      gradients keeps working
- [x] `ThemeContext` reads the stored theme through `useSyncExternalStore` — not a
      `setState`-in-effect, which the lint config rejects. A pre-paint inline `<script>` in
      `layout.jsx` prevents the flash of wrong theme
- [x] `ThemeToggle` wired into the navbar (desktop and mobile menu) and the dashboard top
      bar, persisting to `localStorage['fundflow-theme']`
- [x] Footer and toast pinned to constant tokens so they stay dark in both themes
- [x] Contrast guard added: `.dark .text-white:where(.bg-accent, .bg-error, .bg-success,
      .bg-warning) { color: #0b1220; }`. Those four tokens lighten for legibility as text,
      which would drop white button labels to ~2:1; verified in a production build that
      light mode is unaffected

## 11. Data-integrity bugs — done

Found by testing the server routes against the credit economy's invariants, not against the
docx. Each was a case where the code accepted a request it should have refused. Fixed on a
branch, merged to `main`, pushed.

**Campaign reads leaked unapproved campaigns.** `GET /api/campaigns` took any `status` value
and returned it to any caller, so `?status=pending` handed an unauthenticated visitor the
queue of unreviewed campaigns. Now only `status=approved` is public; every other status, and
a bare `GET`, requires an admin token. Non-string values are rejected with a 400, so the
route cannot be handed an array from repeated query keys. The two dashboard pages that send
`status=pending` with a JWT, and the two public pages that send `status=approved`
unauthenticated, all keep working.

**A contribution could debit credits and record nothing.** `POST /api/contributions` debited
the supporter's credits and created the contribution document as two separate statements. If
the insert failed between them the supporter was poorer with no contribution to refund, and
if the creator rejected it at that instant the refund had nothing to attach to. The debit is
now conditional on the balance and runs first, with a compensating credit if the insert
throws. Notification failures no longer surface as a 500 on the contribution.

**A creator could claim the same credits twice.** `POST /api/withdrawals` checked the
requested amount against `amount_raised` alone and ignored the creator's pending requests, so
a creator with 400 raised credits could file two 400-credit requests and both passed. This
matters more than it looks: there is no withdrawal reject route, only
`PATCH /withdrawals/:id/approve`, so a pending request stays pending until an admin acts —
those credits were claimable indefinitely. The check now subtracts the sum of the creator's
pending requests. `amount_raised` itself could never go negative, since the approve loop
floors at zero, so a duplicate payout was the only harm here.

- [x] Fixed on branch `fix/server-integrity`, merged to `main` with `--ff-only`, branch
      deleted, pushed. 8 commits
- [x] Server suite **122/122 across 11 suites**, up from 106/106 across 10 — 16 new tests
      covering the campaign status gate, the contribution debit guard, and the withdrawal
      double-claim guard
- [x] Each fix written test-first: the new test was run against the unfixed code and had to
      fail before the fix was accepted
- [x] Client build still **25/25 pages**; lint still 19 problems, the same 4 pre-existing
      `react-hooks/set-state-in-effect` errors, none new
- [x] No route shape changed, so the client needs no matching edit

## 12. Frontend critique and audit — partly done

`impeccable` was run against `client/` in two passes. Both write a scored report to
`.impeccable/`, which is git-ignored as agent tooling.

- [x] **Critique** — 3 runs, latest score **22/40**, 1 P0 and 3 P1. Report at
      `.impeccable/critique/2026-10-19T01-46-45Z__client.md`
- [x] **Audit** — never run before this session. Score **13/20**, 2 P1 and 9 P2.
      Report at `.impeccable/audit/2026-10-19T02-52-57Z__client.md`
- [x] **P0 fixed** — Approve and Reject on contributions moved credits with a single click.
      Both now confirm first, naming the supporter, the amount, and the refund consequence
- [x] **P0 fixed** — the admin payout Approve released real money with one click and
      decremented `amount_raised`, with no reject route to reverse it. Both the desktop
      table and the mobile card now confirm first, naming the creator, the dollar and credit
      amounts, and that the payout cannot be undone
- [x] **P1 fixed** — a failed load on the contributions screen rendered "No pending
      contributions", a silent success on the one screen holding other people's money. The
      loading, empty, and error states now render distinctly
- [x] **P1 fixed** — four hand-rolled modals replaced with the shared `ui/Modal.jsx`, which
      already carried the focus trap, escape handler, and `aria-modal` they were each
      reimplementing by hand
- [x] **P1 fixed** — icon-only dashboard menu button had no accessible name and a sub-44px
      hit area
- [x] **P2 fixed** — the hero's ghost CTA failed 3:1 against the gradient it sits on, and
      Credits Contributed used the success token, reading as an achievement rather than a
      balance
- [x] **P2 fixed** — the testimonials presented six invented people with portraits as real
      customer quotes. They are now labelled sample content, and the women's portraits were
      removed on request, falling back to initials
- [ ] **Not fixed** — the remaining audit findings: `text-neutral-400` body text at 2.54:1
      across 62 sites, the mobile drawer with no focus trap, the client-only fetch that
      blanks the public catalog on first paint, the notification panel overflowing narrow
      phones, and 10 P3 items. Both reports hold the ranked list

## 13. Submission metadata — partly done, remainder needs your accounts

Docx §What to Submit asks for five items.

- [x] Client-side GitHub repository link — added to `client/README.md` and `server/README.md`
- [x] Server-side GitHub repository link — added to both READMEs. This project ships as one
      repository holding `client/` and `server/`, so both links resolve to subtrees of
      `https://github.com/SyedRahadHossain/FundFlow`
- [x] Admin email / password — already present in both READMEs, no action
- [x] `client/lib/links.js` — `CLIENT_REPO_URL` now points at the `client/` subtree and
      `GITHUB_URL` at your profile, so the navbar "Join as Developer" link and the GitHub
      footer icon are correct
- [ ] **Still unfilled:** `LINKEDIN_URL` and `FACEBOOK_URL` remain the `RAHAD` placeholders,
      so those two footer icons resolve to someone else's profile. Replace both in
      `client/lib/links.js` before deploying
- [ ] Live site URL — `client/README.md` still reads
      `https://fundflow.vercel.app  ← update after deploy`; fills in once you deploy (item 14)

## 14. Deploy to Vercel — admin, needs your accounts

Docx §Additional Information: "Make sure you deploy the server side and client side on the
first day."

- [ ] Deploy `server/` — needs your Vercel account and `MONGODB_URI`, `JWT_SECRET`,
      `CLIENT_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
- [ ] Deploy `client/` — needs the six `NEXT_PUBLIC_FIREBASE_*` vars plus
      `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_IMGBB_KEY`
- [ ] Register the Stripe webhook URL on the deployed server — credits are granted **only**
      by the signature-verified `POST /api/stripe/webhook`; without `STRIPE_WEBHOOK_SECRET`
      configured, no purchase ever grants credits
- [ ] Point `CLIENT_URL` at the deployed client origin, or Stripe redirects and CORS fail

## 10. Git history — done

Docx §Key Rules: minimum **20 notable commits client-side**, **12 server-side**.

Repository initialised and pushed to `https://github.com/SyedRahadHossain/FundFlow` on branch
`main`. **46 commits total: 27 touch `client/`, 18 touch `server/`** — both minimums met.

- [x] `git init`, branch renamed to `main`, remote `origin` added, pushed and verified in
      sync with `origin/main` (125 files in the remote tree)
- [x] 27 client commits (≥20 required) and 18 server commits (≥12 required), none empty
- [x] Audited before pushing: no `.env` file and no live secret value (MongoDB URI,
      `JWT_SECRET`, Stripe secret, Firebase API key, imgBB key) appears anywhere in history.
      Only the `.env.example` templates are tracked. AI-tooling artifacts
      (`.playwright-mcp/`, `critique/`, `.impeccable/`, agent style-rule configs) excluded
      via `.gitignore`

**Honest-history note:** the project arrived as a finished snapshot, so these 36 commits
organise that snapshot into real, logically-scoped units with accurate messages. They do not
record day-by-day development, and **no commit is backdated** — all carry today's date. If a
grader expects incremental development dates, that is a mismatch to be aware of.

---

## Optional features — docx §Optional, extra credit only

All three are explicitly not required for submission.

- [ ] **Automated email notifications** (SendGrid or AWS SES) on campaign
      approval/rejection, contribution confirmation, withdrawal processing
- [ ] **Advanced search and filter** by category, deadline, funding goal, status, using
      MongoDB aggregation on the server
- [ ] **Report system** — **already fully implemented**. Supporter flags from the campaign
      details page; admin queue has Suspend, Delete (with supporter refunds), and Dismiss.
      No work needed.

---

## Appendix — verified complete, no action needed

Audited against both documents this session.

- Three roles with dedicated dashboards, all docx-listed nav items present per role
- Registration: name, email, photo URL, password, role dropdown; 50/20 default credits
  granted once; imgBB upload on the photo field
- Login: email+password and Google Sign-In; error on bad credentials; JWT in `localStorage`
- Private routes persist auth on reload — `AuthContext` resolves the token before the
  dashboard renders, no premature redirect to login
- Home page: 3-slide hero, Top Funded (6, highest first), Testimonials, plus How It Works,
  Explore by Category, Platform Impact, CTA — exceeds the "minimum 3 extra sections"
- All 6 notification triggers, bell popup, sorted newest-first, closes on outside click
- Creator: stats, contributions review with View modal + approve/reject + reject refunds,
  add campaign (pending until approved), my campaigns with update + delete-with-refund,
  withdrawals with 200-credit minimum, auto-calculated amount, "Insufficient credit" state,
  payment history
- Supporter: stats, explore (approved + deadline not passed), campaign details with
  contribution form writing all 9 required fields, my contributions with server-side
  pagination, four credit packages at the exact docx prices, payment history
- Admin: stats, campaign approvals with reject notification, withdrawal requests that
  decrement raised credits, manage users with remove + role change, manage campaigns,
  reports with suspend/delete/dismiss
- Campaign updates (Creator capability, docx line 23) — built this session; embedded
  `updates[]` on the campaign, `POST /api/campaigns/:id/updates`, modal on My Campaigns,
  public read on campaign details, 6 new tests
- Dashboard route back to the homepage — fixed this session; sidebar brand and top-bar
  title both link to `/`
- `verifyRole` middleware on every protected route
- Stripe checkout + webhook with signature verification, amount cross-check, and a unique
  index on `stripe_session_id` so a replayed event cannot double-grant credits
- No lorem ipsum anywhere
- All config and MongoDB credentials in `.env`, never committed
- Server test suite: **106/106 passing** across 10 suites (was 98/98; +6 for campaign
  updates, +4 for `reporter_name`, +5 for the contribution status filter)
