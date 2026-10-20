# FundFlow Design System

## Color Tokens

### Primary (Brand)
- `--color-primary`: #4f46e5 (indigo-600) — Primary actions, links, brand
- `--color-primary-hover`: #4338ca (indigo-700) — Hover states
- `--color-primary-light`: #eef2ff (indigo-50) — Backgrounds, badges
- `--color-primary-medium`: #c7d2fe (indigo-200) — Avatars, accents
- `--color-primary-dark`: #3730a3 (indigo-800) — Text on light backgrounds

### Neutral (Grays)
- `--color-neutral-50`: #f9fafb — Page backgrounds
- `--color-neutral-100`: #f3f4f6 — Card backgrounds, borders
- `--color-neutral-200`: #e5e7eb — Dividers
- `--color-neutral-300`: #d1d5db — Input borders
- `--color-neutral-400`: #9ca3af — Placeholder text
- `--color-neutral-500`: #6b7280 — Secondary text
- `--color-neutral-600`: #4b5563 — Body text (light backgrounds)
- `--color-neutral-700`: #374151 — Headings
- `--color-neutral-800`: #1f2937 — Strong emphasis
- `--color-neutral-900`: #111827 — Maximum contrast

### Semantic
- `--color-error`: #dc2626 (red-600) — Error states, destructive actions
- `--color-error-light`: #fef2f2 (red-50) — Error backgrounds
- `--color-error-hover`: #b91c1c (red-700) — Error hover
- `--color-success`: #16a34a (green-600) — Success states
- `--color-warning`: #eab308 (yellow-500) — Warnings, badges
- `--color-info`: #3b82f6 (blue-600) — Info states

## Typography
- **Font family**: System stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, sans-serif`)
- **Headings**: Bold, neutral-900
- **Body**: Regular, neutral-600
- **Small text**: 0.875rem (14px)

## Spacing & Layout
- **Border radius**: 
  - Small (buttons, inputs): 0.5rem (8px) — `rounded-lg`
  - Medium (cards): 1rem (16px) — `rounded-xl`
  - Large (modals, containers): 1.5rem (24px) — `rounded-2xl`
- **Shadows**: Tailwind default `shadow-sm`, `shadow-lg`
- **Container**: `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`

## Components

### Buttons
- **Primary**: `bg-primary hover:bg-primary-hover text-white font-semibold py-2.5 px-4 rounded-lg`
- **Secondary**: `border border-neutral-300 hover:bg-neutral-50 text-neutral-700 font-medium py-2.5 px-4 rounded-lg`
- **Destructive**: `text-error hover:bg-error-light`

### Forms
- **Input**: `border border-neutral-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-3 focus:ring-primary`
- **Label**: `text-sm font-medium text-neutral-700 mb-1`
- **Error**: `text-error text-xs mt-1`
- **Required indicator**: `text-error` asterisk with `aria-label="required"`

### Cards
- **Base**: `bg-white rounded-2xl border border-neutral-100 shadow-sm hover:shadow-lg transition-shadow`
- **Padding**: `p-4` or `p-8` depending on content density

### Navigation
- **Active state**: `bg-primary text-white`
- **Inactive state**: `text-neutral-600 hover:bg-neutral-50 hover:text-primary`

## Accessibility
- **Focus rings**: 3px ring with primary color (`focus:ring-3 focus:ring-primary`)
- **Touch targets**: Minimum 44x44px for interactive elements
- **Motion**: Respects `prefers-reduced-motion`
- **ARIA**: Labels, roles, and states on all interactive elements
- **Alt text**: Descriptive text for all images
- **Icons**: drawn SVG lines from `components/ui/Icon.jsx`, never emoji — decorative glyphs carry `aria-hidden="true"`, a standalone glyph takes `role="img"` and an `aria-label`

## Current State
- **Implementation**: CSS variables defined in `globals.css`
- **Usage**: Direct Tailwind classes (migration to CSS variables pending)
- **Dark mode**: Not yet implemented
- **Theme switching**: Not yet implemented
