---
name: FundFlow
description: Trust-first crowdfunding platform with asymmetric credit economy
colors:
  primary: "#4f46e5"
  primary-hover: "#4338ca"
  primary-light: "#eef2ff"
  primary-medium: "#c7d2fe"
  primary-dark: "#3730a3"
  accent: "#0f766e"
  accent-hover: "#115e59"
  accent-light: "#f0fdfa"
  neutral-50: "#f9fafb"
  neutral-100: "#f3f4f6"
  neutral-200: "#e5e7eb"
  neutral-300: "#d1d5db"
  neutral-400: "#9ca3af"
  neutral-500: "#6b7280"
  neutral-600: "#4b5563"
  neutral-700: "#374151"
  neutral-800: "#1f2937"
  neutral-900: "#111827"
  error: "#dc2626"
  error-light: "#fef2f2"
  error-hover: "#b91c1c"
  success: "#16a34a"
  success-light: "#f0fdf4"
  success-dark: "#15803d"
  warning: "#eab308"
  warning-light: "#fefce8"
  warning-dark: "#a16207"
  info: "#3b82f6"
  info-light: "#eff6ff"
  info-dark: "#1d4ed8"
  surface: "#ffffff"
  canvas: "#f9fafb"
  field-muted: "#dbe3ff"
  field-credit: "#7ff0dd"
  field-ink: "#111827"
  surface-0: "#ffffff"
  surface-1: "#f9fafb"
  surface-2: "#f3f4f6"
  surface-3: "#e5e7eb"
typography:
  display:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 3.75rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif"
    fontSize: "clamp(1.875rem, 3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.01em"
rounded:
  sm: "0.375rem"
  md: "0.5rem"
  lg: "0.75rem"
  xl: "1rem"
  "2xl": "1.5rem"
spacing:
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "0.625rem 1rem"
    height: "2.5rem"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "0.625rem 1rem"
    height: "2.5rem"
  button-secondary:
    backgroundColor: "{colors.surface-0}"
    textColor: "{colors.neutral-700}"
    rounded: "{rounded.xl}"
    padding: "0.625rem 1rem"
    height: "2.5rem"
  button-destructive:
    backgroundColor: "{colors.error}"
    textColor: "#ffffff"
    rounded: "{rounded.xl}"
    padding: "0.625rem 1rem"
    height: "2.5rem"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-700}"
    rounded: "{rounded.xl}"
    padding: "0.625rem 1rem"
    height: "2.5rem"
  button-link:
    backgroundColor: "transparent"
    textColor: "{colors.primary}"
    rounded: "{rounded.xl}"
    padding: "0.625rem 1rem"
    height: "2.5rem"
  input-default:
    backgroundColor: "{colors.surface-0}"
    textColor: "{colors.neutral-900}"
    rounded: "{rounded.xl}"
    padding: "0.625rem 1rem"
    height: "2.5rem"
  input-error:
    backgroundColor: "{colors.surface-0}"
    textColor: "{colors.neutral-900}"
    rounded: "{rounded.xl}"
    padding: "0.625rem 1rem"
    height: "2.5rem"
  card-default:
    backgroundColor: "{colors.surface-0}"
    textColor: "{colors.neutral-900}"
    rounded: "{rounded.2xl}"
    padding: "1.25rem"
  card-interactive:
    backgroundColor: "{colors.surface-0}"
    textColor: "{colors.neutral-900}"
    rounded: "{rounded.2xl}"
    padding: "1.25rem"
  badge-primary:
    backgroundColor: "{colors.primary-light}"
    textColor: "{colors.primary-dark}"
    rounded: "9999px"
    padding: "0.25rem 0.625rem"
  badge-success:
    backgroundColor: "{colors.success-light}"
    textColor: "{colors.success-dark}"
    rounded: "9999px"
    padding: "0.25rem 0.625rem"
  badge-warning:
    backgroundColor: "{colors.warning-light}"
    textColor: "{colors.warning-dark}"
    rounded: "9999px"
    padding: "0.25rem 0.625rem"
  badge-error:
    backgroundColor: "{colors.error-light}"
    textColor: "{colors.error-hover}"
    rounded: "9999px"
    padding: "0.25rem 0.625rem"
  badge-outline:
    backgroundColor: "transparent"
    textColor: "{colors.neutral-700}"
    rounded: "9999px"
    padding: "0.25rem 0.625rem"
---

# Design System: FundFlow

## Overview

**Creative North Star: "The Trust Ledger"**

FundFlow's visual identity is built on the metaphor of a trustworthy financial ledger — precise, transparent, and quietly confident. The design system prioritizes clarity over decoration, using an indigo primary that conveys institutional trust without corporate coldness, paired with a teal accent that signals growth and creator success. Every visual decision reinforces the platform's core promise: credits are reversible, contributions are gated by approval, and the asymmetric economy (10c=$1 in, 20c=$1 out) is surfaced, not hidden.

The system is **Operate-mode first** — dashboards, forms, and data-dense screens dominate. Brand expression lives in precise details: the 3px focus ring, the 8px radius on inputs, the consistent 150ms transitions, the one icon vocabulary that keeps financial UI human. There is no marketing gloss on the product surfaces; the landing page is the only Persuade-mode surface — the hero field, the ledger path, the ranking and the impact band — and it uses the same token vocabulary.

**Key Characteristics:**
- Asymmetric trust: every value transfer has a visible reversal path
- Role-separated dashboards — no mixed-context UI
- Indigo primary + teal accent = institutional trust + creator growth
- One icon vocabulary (`components/ui/Icon.jsx`): 49 drawn 24px line glyphs, one meaning one glyph everywhere
- CSS variables as source of truth; Tailwind theme utilities as implementation
- Dark mode via `prefers-color-scheme` plus a manual toggle persisted to `localStorage['fundflow-theme']`
- 3px focus rings on primary, 150–200ms transitions throughout
- Minimum 44px touch targets, `prefers-reduced-motion` respected
- The catalog and the landing page are read on the server and revalidated every 60s

## Colors

The palette is organized around a single primary (indigo) with a teal accent for secondary actions and creator-facing success states. Neutrals form a complete 10-step scale used for text hierarchy, surfaces, and borders. Semantic colors (error, success, warning, info) have light variants for backgrounds and hover variants for interactive states.

### Primary
- **Deep Indigo** (#4f46e5 / `oklch(55% 0.22 264)`): Primary actions, links, brand marks, focus rings. The trust anchor.
- **Indigo Hover** (#4338ca): Primary button hover, active link states.
- **Indigo Tint** (#eef2ff): Primary backgrounds, badges, avatar fallbacks, selection highlight.
- **Indigo Medium** (#c7d2fe): Avatar backgrounds, subtle accents, disabled primary.
- **Indigo Deep** (#3730a3): Text on light primary backgrounds.

### Accent
- **Teal Green** (#0f766e): Secondary actions, creator success states, credit-positive UI.
- **Teal Hover** (#115e59): Accent button hover.
- **Teal Tint** (#f0fdfa): Accent backgrounds, creator dashboard highlights.

### Neutral
- **Neutral 50** (#f9fafb): Page backgrounds (light mode).
- **Neutral 100** (#f3f4f6): Card backgrounds, input backgrounds, hover states.
- **Neutral 200** (#e5e7eb): Borders, dividers, disabled borders.
- **Neutral 300** (#d1d5db): Input borders, placeholder text, scrollbar thumbs.
- **Neutral 400** (#9ca3af): Placeholder text, secondary icons, avatar fallbacks.
- **Neutral 500** (#6b7280): Secondary body text, muted labels.
- **Neutral 600** (#4b5563): Body text on light backgrounds.
- **Neutral 700** (#374151): Headings, primary labels, active nav text.
- **Neutral 800** (#1f2937): Strong emphasis, card titles.
- **Neutral 900** (#111827): Maximum contrast, primary headings.

### Semantic
- **Error Red** (#dc2626): Destructive actions, rejected states, validation errors.
- **Error Light** (#fef2f2): Error message backgrounds, error input backgrounds.
- **Error Hover** (#b91c1c): Destructive button hover.
- **Success Green** (#16a34a): Approved states, completed actions, positive metrics.
- **Success Light** (#f0fdf4): Success message backgrounds, approved badges.
- **Warning Amber** (#eab308): Pending states, attention needed, top-funded badges.
- **Warning Light** (#fefce8): Warning backgrounds, pending badges.
- **Info Blue** (#3b82f6): Informational states, neutral actions.
- **Info Light** (#eff6ff): Info backgrounds.

### Surfaces
- **Surface 0** (#ffffff): Elevated cards, modals, dropdowns.
- **Surface 1** (#f9fafb): Page background, card background alternative.
- **Surface 2** (#f3f4f6): Secondary card backgrounds, input backgrounds.
- **Surface 3** (#e5e7eb): Dividers, borders, disabled surfaces.

### Persuade Fields
- **Hero Field A / B / C** (`--field-hero-a|b|c`): the three constant indigo→teal gradients behind the hero slides.
- **Impact Field** (`--field-impact`): the constant indigo→teal gradient behind the Platform Impact band.
- **Field Muted** (`--color-field-muted`, #dbe3ff): secondary copy on a persuade field.
- **Field Credit** (`--color-field-credit`, #7ff0dd): the credit figure on a persuade field, for large numerals only, where 3:1 is the bar.

### Named Rules
**The One Voice Rule.** The primary indigo appears on ≤15% of any dashboard screen. Its rarity is the trust signal — it marks the one action that matters.

**The Credit Color Rule.** Credit balances and credit amounts always use the primary indigo (#4f46e5) or teal accent (#0f766e), never semantic green. Green is reserved for *approval status*, not *currency value*.

**The Reversal Visibility Rule.** Every destructive or reversible action (reject contribution, delete campaign, refund) uses the error red with its light background — the visual weight matches the financial consequence.

**The Constant Field Rule.** A persuade field is theme-independent. The neutral ramp inverting under a dark brand gradient would put white copy on light ground, so the hero, the impact band, and the footer hold their own colors in both themes and one contrast pair is verified instead of two. Copy on a field uses `field-muted` or `field-credit`, never the neutral ramp.

### Color Roles

Five roles, one job each. A hue that marks nothing is decoration; a hue that marks two things is noise.

| Role | Token | Owns |
|---|---|---|
| Action | `primary` (indigo) | The one control per screen that matters: primary buttons, active nav, links, focus. |
| Credit | `accent` (teal) | Every credit count and balance, wherever it appears — tables, tiles, chips, the navbar balance. |
| Figure | `field-credit` (#7ff0dd) | The credit figure at display size on a constant field, where the neutral ramp cannot be trusted. |
| Money | `neutral-900` / `neutral-700` (ink) | USD figures. A dollar amount is ledger ink; teal marks a credit, never a price. Ink also carries emphasis that is not money — the recommended-package flag is the ledger's own paper. |
| State | `success` / `warning` / `error` / `info` | Approval, review, and failure state only. |

**The Credit Role Rule.** Credits are teal everywhere, including the navbar and dashboard balance chips — the hue is the role, not a per-screen choice. Credit figures are never indigo (indigo is the action) and never green. A hue that is not a credit does not get teal: the "Most Popular" package flag is ink, because on that screen every credit amount already wears teal.

**The Money Is Ink Rule.** Dollar amounts render in the neutral ink ramp with `tabular-nums`, never in the credit teal. On a card that shows both, the credit count carries the hue and the price stays ink, so the two numbers read as different kinds of value.

**The Composed State Rule.** No control paints the same color at rest and on hover. Tinted controls rest on the `-light` surface and deepen to the hue itself (`hover:bg-success/20`, `hover:bg-error/20`, `hover:bg-warning/25`), so interaction is legible in both themes without introducing a new token.

**The Native Surface Rule.** `color-scheme`, `caret-color`, `accent-color`, autofill, text selection, scrollbars, and focus rings are set from the palette in `globals.css`. The browser chrome is part of the design.

## Typography

**Display Font:** System stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif`)
**Body Font:** System stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif`)
**Label/Mono Font:** System stack (same family, `font-mono` for numeric tabular data)

**Character:** The system stack keeps the product feeling native on every platform. No custom font to load, no flash of unstyled text. The weight ladder (400/500/600/700/800) creates hierarchy without font switching.

### Hierarchy
- **Display** (800, clamp(2.5rem, 5vw, 3.75rem), 1.1): Hero headlines only. Landing page H1, hero slider titles.
- **Headline** (700, clamp(1.875rem, 3vw, 2.25rem), 1.25): Page titles, dashboard section headers, modal titles.
- **Title** (600, 1.25rem, 1.4): Card titles, campaign names, table headers.
- **Body** (400, 1rem, 1.6): Paragraphs, descriptions, form help text. Max line length 65–75ch on reading surfaces.
- **Label** (500, 0.875rem, 1.5, 0.01em tracking): Form labels, nav items, button text, badge text, metric labels.

### Named Rules
**The System Stack Rule.** No custom web fonts. The product is an Operate-mode tool; native font rendering beats brand expression on every platform.

**The Numeric Tabular Rule.** Credit amounts, percentages, and tabular numbers use `tabular-nums` (via `font-variant-numeric: tabular-nums`) to prevent layout shift during live updates.

**The Line Icon Rule.** The product's icons are drawn, not typed. One 24×24 grid, one stroke weight (1.5), round caps and joins, `fill="none"`, and `currentColor` so a glyph takes the colour of the text it sits in. One meaning has one glyph, and a glyph is decorative by default (`aria-hidden="true"`) — the label beside it carries the meaning; a standalone icon takes `role="img"` and an `aria-label`.

**The One Icon Set Rule.** The app has exactly one icon source: the drawn SVG line set in `components/ui/Icon.jsx`. Every icon in the product — navigation, stat tiles, buttons, table actions, the bell, the theme switch, the campaign image placeholder, the credit chip — is a name in that registry, drawn on that grid. Emoji are no longer used as UI icons: they render differently on every platform, they carry their own colour, and a meaning may not wear two different faces. A meaning that has no glyph yet gets a new name in the registry, never a typed character and never an inline redraw. Emoji may still appear inside user data (a campaign title, a person's name) and inside comments, because that is the user's text and not the product's chrome.

## Layout

**Spatial Model:** 8px base unit (0.5rem). All spacing, padding, margins, and component dimensions are multiples of 4px (0.25rem) with 8px as the rhythmic heartbeat.

**Container:** `max-w-7xl` (1280px) with responsive padding: `px-4` (mobile), `px-6` (tablet), `px-8` (desktop).

**Dashboard Shell:** Fixed left sidebar (256px / `w-64`) on desktop (`lg:`), mobile drawer overlay. Top bar fixed at 56px (`h-14`). Content area: `flex-1 overflow-y-auto p-4 sm:p-6`.

**Grid System:** CSS Grid for dashboard stats (`grid-cols-1 sm:grid-cols-2 lg:grid-cols-4`), campaign lists (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`), and category chips (`grid-cols-2 sm:grid-cols-4`).

**Density:** Three densities encoded in component props — `sm`/`md`/`lg`/`xl` on Card, Button, Input, Badge, ProgressBar. Default is `md` (comfortable for Operate-mode). `sm` for dense tables; `lg` for hero CTAs.

**Responsive Breakpoints:** Tailwind defaults (`sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`). Sidebar collapses at `lg`.

**Safe Areas:** the viewport is `viewport-fit=cover`; the mobile drawer takes `env(safe-area-inset-top)` so it never opens under a notch.

**Touch Targets:** 44px is the floor, enforced by the kit (`Button` carries `min-h-11`, and the `Input`/`Select` fields carry it too) and applied to the controls that are not buttons — the bell, the modal close button, the filter chips, the pagination.

### Data Delivery
- **Server-rendered public surfaces:** the landing page and the campaign index are read on the server (`lib/catalog.js`) and revalidated every 60 seconds. The first screen ships with its content in the HTML; the browser only fetches when the server read failed.
- **Authenticated surfaces:** the dashboards read their own data from the browser, behind the JWT.
- **One profile read:** the auth context fetches `/api/auth/me` once per app load and hands the balance and the display name to everything that needs them.
- **One poller:** `lib/poller.js` runs a single 30-second tick for the whole app, skipped while the tab is hidden, and refires when the tab comes back.

### Named Rules
**The Dashboard Density Rule.** Dashboards default to comfortable density (`md` padding, `gap-4` grids). Only admin tables and high-volume lists use `sm`.

**The Content Width Rule.** Reading content (campaign descriptions, help text) constrained to 65–75ch. Data tables and dashboards use full container width.

## Elevation & Depth

**Philosophy:** Flat-by-default with state-driven elevation. Surfaces are flat at rest (`shadow-sm`); elevation appears only as response to interaction (hover, focus, active) or modal overlay.

**Shadow Vocabulary:**
- **Ambient Low** (`0 1px 2px 0 rgb(0 0 0 / 0.05)`): Default card shadow, resting state.
- **Ambient Medium** (`0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`): Hover elevation on cards, dropdown menus.
- **Ambient High** (`0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`: Modal overlay, mobile drawer, interactive card hover.
- **Ambient Max** (`0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`): Full-screen modal, critical dialogs.

**Overlay Scrim:** `bg-black/50` for modals, `bg-black/40` for mobile drawer.

### Named Rules
**The Flat-By-Default Rule.** No resting shadows on page backgrounds, navbars, or static cards. Shadows are earned by interaction.

**The Focus Ring Rule.** All interactive elements show a 3px primary-colored ring on `:focus-visible` with 2px offset on the surface color. Never rely on browser default outline.

**The Modal Layer Rule.** Modals render via portal at `z-50` with scrim. Mobile drawer at `z-50` with `bg-black/40` scrim. Tooltips and dropdowns at `z-50`.

## Shapes

**Corner Language:** Consistent rounded scale — `sm` (6px) for badges, chips; `md` (8px) for buttons, inputs; `lg` (12px) not used; `xl` (16px) for cards, modals, dropdowns; `2xl` (24px) for hero cards, feature cards.

**Border Strategy:** 1px solid `neutral-200` (light) / `neutral-700` (dark) on cards, inputs, modals. No borders on primary buttons. Outline variants use `neutral-300` border.

**Form Language:** Rectangular with rounded corners. No pills except badges and avatar circles. No sharp corners anywhere.

**Clipping:** Images in CampaignCard use `object-cover` with parent `overflow-hidden`. Avatar images use `object-cover` with shape-specific `rounded-full` / `rounded-xl` / `rounded-lg`.

### Named Rules
**The Radius Ladder Rule.** Components use exactly five radius tokens. No ad-hoc `rounded-[value]`. Badge → `full` (maps to `rounded-full` in CSS), Button/Input → `xl` (16px), Card/Modal → `2xl` (24px).

**The Border Consistency Rule.** All borders are 1px. No 2px borders except focus rings (3px) and file input drag area (2px dashed).

## Components

### Buttons
- **Shape:** `rounded-xl` (16px), `font-semibold`, `inline-flex items-center justify-center gap-2`, `transition-all duration-150 ease-out`, `active:scale-[0.98]`, `focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2`, `disabled:opacity-50 disabled:cursor-not-allowed`, min 44px touch target.
- **Primary:** `bg-primary text-white shadow-sm` → hover `bg-primary-hover` → active `scale-[0.98]`.
- **Secondary:** `border border-neutral-300 bg-white text-neutral-700` → hover `bg-neutral-50` → active `bg-neutral-100`.
- **Destructive:** `bg-error text-white shadow-sm` → hover `bg-error-hover` → active `scale-[0.98]`.
- **Outline:** `border border-neutral-300 bg-transparent text-neutral-700` → hover `bg-neutral-50`.
- **Ghost:** `bg-transparent text-neutral-700` → hover `bg-neutral-100`.
- **Link:** `bg-transparent text-primary` → hover `text-primary-hover underline`.
- **Sizes:** `sm` (px-3 py-1.5 text-xs), `md` (px-4 py-2.5 text-sm), `lg` (px-6 py-3 text-base), `xl` (px-8 py-4 text-lg).
- **Loading State:** Inline spinner (16px) + "Loading..." text, `aria-busy="true"`, `aria-disabled="true"`.
- **AsChild:** The child *is* the button. The variant and size classes are cloned onto the anchor or link, so the painted box and the hit box are the same box — a padded wrapper around the link leaves the padding dead to pointer and drops the target to the height of its label. `disabled` never reaches the anchor; the state is carried by `aria-disabled`.
- **Minimum height:** `min-h-11` (44px) on every variant, so the 44px touch-target baseline is enforced by the kit rather than by each call site.

### Inputs / Fields
- **Shape:** `rounded-xl` (16px), `border`, `bg-surface`, `text-base sm:text-sm` (16px on a phone, so iOS does not zoom the page on focus), `px-4 py-2.5`, `transition-colors duration-150`, `placeholder:text-neutral-500`, `focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2`.
- **Default Border:** `border-neutral-300` → hover `border-neutral-400` → focus `border-primary`.
- **Error Border:** `border-error` → focus `ring-error`.
- **Disabled:** `bg-neutral-50 cursor-not-allowed`.
- **Left/Right Icons:** Absolute positioned, `pl-10` / `pr-10` padding adjustment, `text-neutral-400`, `aria-hidden="true"`.
- **Label:** `text-sm font-medium text-neutral-700 mb-1.5`, required asterisk `text-error` with `aria-hidden="true"`.
- **Help Text:** `text-xs text-neutral-500 mt-1.5`, `role="note"` unless error present.
- **Error Text:** `text-xs text-error mt-1.5 flex items-center gap-1`, `role="alert"`, leading error icon SVG.
- **Textarea:** Same as input, `min-h-[80px] resize-y`.
- **Select:** Same as input, `appearance-none`.
- **File Input:** Dashed border `border-2 border-dashed rounded-xl p-4`, drag-over `border-primary bg-primary-light`, hidden native input `opacity-0 cursor-pointer`.

### Cards / Containers
- **Base Card:** `bg-white rounded-2xl border border-neutral-100 shadow-sm`, `transition-shadow duration-200`, padding via prop: `none`/`sm` (p-3)/`md` (p-5)/`lg` (p-6)/`xl` (p-8).
- **Hover Card:** Adds `hover:shadow-lg`.
- **Interactive Card:** Base + `hover:shadow-lg hover:border-primary-medium hover:-translate-y-0.5`, `focus-visible:ring-3 focus-visible:ring-primary focus-visible:ring-offset-2`, renders as `<a>` or `<div>` with `cursor-pointer`.
- **Card Sub-components:** `CardHeader` (mb-4), `CardTitle` (text-lg font-semibold text-neutral-900), `CardDescription` (mt-1 text-sm text-neutral-500), `CardContent`, `CardFooter` (mt-4 pt-4 border-t border-neutral-100 flex items-center gap-2).

### Badges / Chips
- **Shape:** `rounded-full`, `inline-flex items-center font-medium`, `transition-colors duration-150`.
- **Variants:** exactly eight — `default` (neutral-100/neutral-700), `primary` (primary-light/primary-dark), `secondary` (neutral-100/neutral-700), `success` (success-light/success-dark), `warning` (warning-light/warning-dark), `error` (error-light/error-hover), `info` (info-light/info-dark), `outline` (border-neutral-300 transparent/neutral-700).
- **Sizes:** `sm` (px-2 py-0.5 text-xs), `md` (px-2.5 py-1 text-xs), `lg` (px-3 py-1.5 text-sm).
- **Dot Indicator:** Optional 6px dot for status badges (`w-1.5 h-1.5 rounded-full`), color matches variant.
- **StatusBadge:** Maps status → variant + dot: `pending`→warning+dot, `approved`→success+dot, `active`→success+dot, `rejected`→error+dot, `completed`→primary+dot, `draft`→secondary+dot.
- **CategoryBadge:** Always `outline` `sm` `font-semibold`.
- **TopFundedBadge:** Always `warning` `sm` `font-bold` with rank.

### Icons
- **Source:** `components/ui/Icon.jsx` — one registry, 49 drawn glyphs, one per meaning. The navigation, the stat tiles, the action cards and the empty states all take their icon from here, so the same idea cannot wear two different faces.
- **Glyph set:** a hand-drawn 24×24 line set — `stroke="currentColor"`, `stroke-width="1.5"`, `fill="none"`, `stroke-linecap="round"`, `stroke-linejoin="round"`, `viewBox="0 0 24 24"`. One grid, one weight, one style. No emoji, no icon library, no inline redraw.
- **Names:** `home`, `explore`, `contributions`, `payments`, `credits`, `history`, `add`, `campaigns`, `approve`, `wallet`, `dashboard`, `users`, `reports`, `signout`, `edit`, `delete`, `announce`, `eye`, `check`, `reject`, `close`, `chevronLeft`, `chevronRight`, `chevronDown`, `upload`, `info`, `menu`, `sun`, `moon`, `message`, `roleSupporter`, `roleCreator`, `roleAdmin`, `person`, `pending`, `launch`, `supporters`, `creators`, `payouts`, `notifications`, `inbox`, `warning`, `shield`, `goal`, `gift`, `wave`, `crown`, `calendar`, `image`.
- **Usage:** `<Icon name="credits" className="w-5 h-5" />`. Decorative by default (`aria-hidden="true"`); pass `label` only for a standalone icon with no visible text (then `role="img"` + `aria-label`). An unknown name renders nothing — `ICON_NAMES` is exported so a typo is catchable without rendering the page.
- **Size:** sized in boxes, never in type — an SVG ignores `font-size`. The sidebar navigation draws them at `w-5 h-5` (20px), the role chip at `w-4.5 h-4.5` (18px), the stat tiles at `w-6 h-6` (24px), the action cards at `w-5 h-5` (20px), the empty states at `w-15 h-15` (60px).
- **In a button:** `Button` puts the glyph in a fixed box chosen by the button's size token (`sm` → 16px, `md`/`lg` → 20px, `xl` → 24px), so every button in the product draws its icon at the same size. A call site passes `<Icon name="delete" />` and never sizes it by hand.
- **Stat tiles:** `StatCard` takes an `icon` prop that is a registry name, never a glyph — the tile draws it at 24px in the tile's own colour.

### Error / Retry Banner
- **Component:** `components/ui/ErrorBanner.jsx` — the one load-failure surface in the product. A failed request is never an empty list, so every screen says so in the same words, with the same retry affordance, in the same place.
- **Structure:** `role="alert"`, `border-error bg-error-light`, `rounded-xl`, `px-4 py-3 text-sm`, message on the left, a ghost `Retry` button on the right.
- **Used by:** the campaign index, the creator and admin homes, the review queue, the withdrawal and payment histories, the campaign manager, the user manager, the reports list and the contribution list.

### Progress Indicators
- **Linear ProgressBar:** `bg-neutral-200 rounded-full overflow-hidden`, height via size (`sm` h-1, `md` h-1.5, `lg` h-2.5, `xl` h-3), fill `rounded-full transition-all duration-500 ease-out`, variant colors (primary/secondary/success/warning/error/accent), `animate-slide-up` on mount, `role="progressbar"` with ARIA values.
- **CircularProgress:** SVG stroke-dasharray, size prop (default 48px), strokeWidth (default 4), variant colors, centered percentage/label.

### Navigation
- **Navbar:** `sticky top-0 z-50 bg-surface border-b border-neutral-200`, height 64px (`h-16`), container max-w-7xl. Logo: indigo diamond SVG + "FundFlow" bold xl. Desktop links: `text-sm text-neutral-600 hover:text-primary font-medium`. Credit chip: `bg-accent-light text-accent-hover px-3 py-1.5 rounded-full font-semibold` — the credit hue, with the rate beside it in ink. User menu: Avatar + dropdown (animate-fade-in).
- **Mobile Navbar:** Burger button (44px min), slide-down drawer (animate-slide-down), min 44px touch targets.
- **Dashboard Sidebar:** Fixed `lg:flex w-64 h-screen sticky top-0`, `bg-surface border-r border-neutral-200`. Brand block (indigo diamond + FundFlow), user chip (Avatar + email + role icon + label), nav items (icon + label, `px-3 py-2.5 min-h-11 rounded-xl`, active `bg-primary text-white`, inactive `text-neutral-600 hover:bg-neutral-50 hover:text-primary`), logout button (error/hover error-light). The mobile drawer is a real dialog: `role="dialog" aria-modal="true"`, focus moves in, Tab stays inside, Escape closes, focus returns to the opener, and a visible close button is always there.

### Avatars
- **Sizes:** `xs` (24px), `sm` (32px), `md` (40px), `lg` (48px), `xl` (64px), `2xl` (80px).
- **Shapes:** `circle` (rounded-full), `square` (rounded-xl), `rounded` (rounded-lg).
- **Fallback:** Hash-based color assignment from a 10-colour palette built only from design tokens — deterministic per name.
- **Status Indicator:** 4 sizes, 4 positions, 4 states (online=success, offline=neutral-400, busy=error, away=warning), 2px white border.
- **AvatarGroup:** Overlap `-space-x-2` with `ring-2 ring-white`, max visible + counter badge.

### Modals / Dialogs
- **Modal:** Portal-rendered, `fixed inset-0 z-50 flex items-center justify-center p-4`, scrim `bg-black/50`, content `bg-white rounded-2xl shadow-xl animate-scale-in`, sizes `sm`→`max-w-sm` through `full`→`max-w-4xl`. Focus trap, `aria-modal="true"`, ESC to close, click scrim to close, restores focus on close.
- **ConfirmDialog:** Modal `sm` with footer: secondary Cancel + variant Confirm (default destructive), loading state.
- **AlertDialog:** Modal `sm` with single primary OK button.

### Empty States
- **Structure:** Centered flex column, `py-16 px-4`, `role="status" aria-live="polite"`, the registry icon at 60px (`w-15 h-15`, aria-hidden), title lg font-semibold, subtitle sm text-neutral-500 max-w-sm, optional action button.
- **Variants per Role:** Campaigns/Contributions/Withdrawals/Payments have role-specific copy (creator/supporter/admin). Notifications/Search have defaults.
- **Skeletons:** `SkeletonCard` (image + 4 text lines), `SkeletonTable` (header + rows), `SkeletonList` (avatar + 3 text lines), all `animate-pulse bg-neutral-200 rounded`.
- **Loading Overlay:** Full-screen `fixed inset-0 z-50 bg-white/80 backdrop-blur-sm` with spinner + message.
- **Inline Loading:** Spinner ring with `aria-busy="true"`.

### Hero Slider (Landing Page)
- **Field:** three constant indigo→teal gradients (`--field-hero-a|b|c`) stacked and cross-faded over 700ms, so the field never flashes the wrong hue mid-transition; one hairline `bg-white/15` rule marks the composition's baseline.
- **Content:** H1 (`text-4xl`→`text-6xl` extrabold, `tracking-tight`, `text-balance`), subtitle in `text-field-muted` capped at 52ch, dual CTAs (primary + ghost at `text-white`), and three trust items as a list with `text-field-muted` icons. No eyebrow badge, no decorative blurred blobs — the ledger below is the page's one authored moment.
- **Credit Converter:** the second column of the hero is the product's own mechanic, live (`components/CreditConverter.jsx`): a native range input over 100–10,000 credits, a 44px hit area, and three readouts — what the supporter pays, what the creator withdraws, what the platform keeps. The rail fills in the action colour; the figures are ink and the rate line below is `text-neutral-500`. It is a fragment of the product, not a picture of one, so its root is marked `data-ui`.
- **Controls:** prev button (48px, `bg-white/10` → `hover:bg-white/25`), slide indicators (44px hit area, active `w-8 bg-white` pill, inactive `bg-white/40` dot), play/pause toggle, arrow-key support, pause on hover and focus, 7s auto-advance that never starts under reduced motion.
- **Motion:** the copy block remounts per slide, so its `animate-slide-up` ladder is the carousel's one rehearsed sequence rather than a scroll effect; reduced motion drops the ladder and keeps the copy.
- **Accessibility:** `role="region" aria-label="Hero carousel"`, controls carry `aria-label` / `aria-pressed` / `aria-current`, indicators name their slide.

### How It Works (Ledger Path)
- **Concept:** the credit economy drawn as the route the money takes — one rail, three nodes (create → collect → withdraw), and the rail filling in the direction the credit travels. The credit figures are teal (`text-accent`), the dollar figures are ink.
- **Three states, in override order:** *rest* is the completed route and is the markup's default, so a browser with no animation and a page with no JS both show the mechanism whole; *played* (`data-run`, set when the section enters view) fills the rail on `--ease-out-quint`; *scrolled* (wide viewport with `animation-timeline: view()`) binds the fill to the scroll position and pins the stage in a 200vh `ledger-scroll` wrapper, with the travel ladder mapped to the pinned middle third.
- **Motion budget:** layered, never doubled — the rail fills vertically on narrow viewports and horizontally on wide ones, and the scroll branch is gated behind `@supports` so a step can never fill twice.
- **Reduced motion:** keeps the completed route and drops the travel.

### Top Funded Campaigns (Ranking)
- **Concept:** the section is a leaderboard. The leader is the one large thing on the page — its picture, its title at display scale, its credits raised as a figure — and the campaigns below it stack on a rail with a node per rank, the same device the ledger path uses for the three steps.
- **Content:** the API returns the top six by credits raised, so the order on screen is the order of the data. The section closes with its action (a link to every campaign, and a create call when there are fewer than three live campaigns), the way a leaderboard closes after the ranking.
- **States:** loading, error and empty all sit inside the same frame, so the section does not change shape when the data lands.

### Explore by Category
- **Concept:** the categories are peers, so they read as an index of plain links — one drawn icon each, the label beside it, space between them. No boxes, no grid lines: the label and the icon are enough. The icons are line drawings (stroke 1.5), not the icon registry, because these are illustrations of a category rather than a system icon.

### Two Sides of the Ledger
- **Concept:** the last persuade field closes the page. It shows the two sides of the same ledger — the supporter's and the creator's — as two worked examples written by the product team, and it says so in its own words ("Two worked examples of the workflows, written by our team"). There are no photographs: a face next to a first-person line reads as a customer talking, and the initials keep the sample honest.
- **Field:** a constant ink ground (`--color-field-ink`) with the field's own tints, so the copy reads the same in both themes. The credit figures wear `field-credit`; the rules between rows are `border-white/10`.

### Campaign Card
- **Aspect Ratios:** `default` h-44, `compact` h-32, `featured` h-56.
- **Image:** Next.js Image fill, `object-cover group-hover:scale-105 transition-transform duration-300`, blur placeholder, lazy load.
- **Overlays:** CategoryBadge top-right, urgency badge bottom-left (≤3 days = error+dot, ended = default). The old TopFundedBadge is no longer used on the card — the ranking section carries the ranking.
- **Content:** Title (line-clamp-2), creator name (xs neutral-500), ProgressBar (primary, animated, label "Funded"), raised amount in teal + days left (flex justify-between), full-width primary Button "View Details".

## Do's and Don'ts

### Do:
- **Do** use the 5-radius ladder exactly: badge=full, button/input=xl (16px), card/modal=2xl (24px).
- **Do** show 3px primary focus rings on every interactive element via `:focus-visible`.
- **Do** take icons from `components/ui/Icon.jsx` — one name per meaning, drawn once — size them in boxes (`w-5 h-5`), never in type sizes, and keep them `aria-hidden="true"` when a label sits beside them.
- **Do** use the 44px minimum touch target on every control, including icon buttons and the rows of a data table.
- **Do** keep primary indigo to ≤15% of dashboard screen area — it marks the one action that matters.
- **Do** display credit amounts in teal (`accent`) everywhere, never semantic green (green = approval status only) and never indigo (indigo = the action).
- **Do** mark a credit figure at display size on a constant field with `field-credit`, and leave the neutral ramp for copy on that field.
- **Do** render dollar amounts in the neutral ink ramp with `tabular-nums` — money is ink, teal is a credit.
- **Do** compose interaction states: a tinted control rests on the `-light` surface and deepens to its own hue on hover.
- **Do** keep a persuade field (hero, impact band) constant across themes and tint its copy with `field-muted` / `field-credit`.
- **Do** theme the native surfaces (`color-scheme`, `caret-color`, `accent-color`, autofill, selection, scrollbars) from `globals.css`.
- **Do** use `tabular-nums` on all credit amounts, percentages, and tabular numbers.
- **Do** use the 8px base spacing unit — all padding, margin, gaps are multiples of 4px with 8px rhythm.
- **Do** respect `prefers-reduced-motion` — disable all animations, `scroll-behavior: auto`.
- **Do** use flat surfaces at rest (`shadow-sm`); elevate only on hover/focus/modal.
- **Do** use deterministic hash-based avatar fallbacks from the 10-color palette.
- **Do** render modals via portal at z-50 with focus trap and focus restoration.
- **Do** use `animate-fade-in` / `animate-slide-up` / `animate-slide-down` / `animate-scale-in` for entrance (respects reduced-motion).
- **Do** keep reading content ≤75ch; dashboards use full container width.
- **Do** use the StatusBadge component for all status displays — it enforces consistent variant+dot mapping.

### Don't:
- **Don't** add custom radii outside the 5-token ladder — no `rounded-[arbitrary]`.
- **Don't** rely on browser default focus outlines — always the 3px primary ring.
- **Don't** use semantic green for credit/currency values — green means "approved", not "money".
- **Don't** paint a control with the same token at rest and on hover — a hover that changes nothing is a missing state.
- **Don't** put a dollar amount in the credit teal, or a credit count in the money ink — the roles are not interchangeable.
- **Don't** use custom web fonts — system stack only.
- **Don't** add resting shadows to page backgrounds, navbars, or static cards.
- **Don't** use 2px borders anywhere except file input drag area and focus rings (3px).
- **Don't** mix Tailwind arbitrary values for colors/spacing/radius — use CSS variables or Tailwind theme tokens.
- **Don't** create new badge variants — use the 8 defined (default, primary, secondary, success, warning, error, info, outline).
- **Don't** omit `aria-label`/`aria-describedby` on form fields with errors/help.
- **Don't** use emoji as icons, and don't inline a glyph where the icon registry already names the meaning — one meaning, one drawn glyph, one icon source (`components/ui/Icon.jsx`).
- **Don't** hardcode hex colors in components — reference CSS variables (`var(--color-primary)`) or Tailwind theme (`bg-primary`).
- **Don't** skip the portal render for modals/drawers — they must escape layout stacking contexts.
- **Don't** use `animate-spin` without `prefers-reduced-motion: no-preference` guard.
- **Don't** add marketing-style gradients or shadows to dashboard surfaces — Operate mode stays flat and scannable.
- **Don't** put neutral-ramp grays or plain `text-white` on a persuade field's secondary copy — the field owns its own muted and credit tints.
- **Don't** animate the same element twice — pick one reveal per element, scroll-bound or time-bound, as the ledger path does.
- **Don't** invent new component patterns — extend existing ones (Card, Button, Badge, Input, Icon, ErrorBanner) via props.
- **Don't** wrap a link in a padded span to fake a button — clone the classes onto the link so the painted box is the hit box.
- **Don't** hide the credit balance on a phone because the bar is narrow — the balance is the number the platform turns on.
- **Don't** load a public list from the browser when the server can render it — the catalog and the landing page are read on the server and revalidated every 60s.