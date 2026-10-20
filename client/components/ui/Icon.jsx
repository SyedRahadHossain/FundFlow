import { cn } from '@/lib/utils';

/**
 * The icon vocabulary.
 *
 * DESIGN.md's Line Icon Rule: the product's icons are drawn, not typed. One
 * 24px grid, one stroke weight (1.5), round caps and joins, and `currentColor`
 * for the ink so a glyph takes the colour of the text it sits in. One meaning
 * has one glyph everywhere — the dashboard navigation, the stat tiles and the
 * action cards can no longer drift apart, and a new surface picks a name
 * instead of inventing a glyph.
 *
 * A glyph is a list of shapes on that grid: `{ d }` for a path, `{ c: [cx, cy,
 * r] }` for a circle. The drawing lives here so no call site can redraw a
 * meaning and drift from the registry.
 *
 * Icons are decorative by default and hidden from assistive technology; the
 * label beside them carries the meaning. Pass `label` only for a standalone
 * icon with no visible text.
 */
const ICONS = {
  // Navigation
  home: [
    { d: 'M3.5 10.9 12 3.9l8.5 7' },
    { d: 'M5.9 9.4V20h12.2V9.4' },
    { d: 'M10 20v-4.6h4V20' },
  ],
  explore: [
    { c: [10.8, 10.8, 6.3] },
    { d: 'M15.4 15.4 20.5 20.5' },
  ],
  contributions: [
    { c: [12, 6.6, 3.4] },
    { d: 'M2.5 12v4.5a5.5 5.5 0 0 0 5.5 5.5h8a5.5 5.5 0 0 0 5.5-5.5V12' },
  ],
  payments: [
    { d: 'M5 5.5h14a2.5 2.5 0 0 1 2.5 2.5v8a2.5 2.5 0 0 1-2.5 2.5H5A2.5 2.5 0 0 1 2.5 16V8A2.5 2.5 0 0 1 5 5.5z' },
    { d: 'M2.5 9.5h19' },
  ],
  credits: [
    { d: 'M12 3.4 19 9l-7 11.6L5 9l7-5.6z' },
    { d: 'M5 9h14' },
    { d: 'M9.4 9 12 3.4 14.6 9 12 20.6' },
  ],
  history: [
    { d: 'M6.5 3.5h7l4.5 4.5v12.5h-11.5V3.5z' },
    { d: 'M13.5 3.5V8h4.5' },
    { d: 'M9 12.5h6' },
    { d: 'M9 16h6' },
  ],
  add: [
    { d: 'M12 5.5v13M5.5 12h13' },
  ],
  campaigns: [
    { d: 'M9 4.5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-12a2 2 0 0 0-2-2h-2' },
    { d: 'M9 3.5h6a1 1 0 0 1 1 1v2H8v-2a1 1 0 0 1 1-1z' },
    { d: 'M9 11.5h6' },
    { d: 'M9 15h6' },
    { d: 'M9 18.5h4' },
  ],
  approve: [
    { c: [12, 12, 8.5] },
    { d: 'M8.4 12.3l2.6 2.6 4.6-5.2' },
  ],
  wallet: [
    { d: 'M8.8 9V7.4a2.6 2.6 0 0 1 2.6-2.6h1.2a2.6 2.6 0 0 1 2.6 2.6V9' },
    { d: 'M3.2 9h17.6a1.2 1.2 0 0 1 1.2 1.2v8.2a2.6 2.6 0 0 1-2.6 2.6H4.6A2.6 2.6 0 0 1 2 18.4v-8.2A1.2 1.2 0 0 1 3.2 9z' },
    { d: 'M10.6 9h2.8v2.4h-2.8z' },
  ],
  dashboard: [
    { d: 'M4 4v16h16' },
    { d: 'M8 20v-5' },
    { d: 'M12 20v-9' },
    { d: 'M16 20v-3' },
  ],
  users: [
    { c: [9, 8.2, 3.3] },
    { d: 'M3.2 19.8a5.8 5.8 0 0 1 11.6 0' },
    { d: 'M15.6 5.1a3.3 3.3 0 0 1 0 6.6' },
    { d: 'M16.8 15.2a5.8 5.8 0 0 1 4.4 4.6' },
  ],
  reports: [
    { d: 'M6 21V4' },
    { d: 'M6 4.5h11.5l-2.2 4 2.2 4H6' },
  ],
  signout: [
    { d: 'M9.5 4.5H6.5A1.5 1.5 0 0 0 5 6v12a1.5 1.5 0 0 0 1.5 1.5h3' },
    { d: 'M13 12h7.5' },
    { d: 'M17 8.5 20.5 12 17 15.5' },
  ],

  // Actions
  edit: [
    { d: 'M4 20l4.2-1L18.7 8.5a2.1 2.1 0 0 0-3-3L5.2 16 4 20z' },
    { d: 'M14.8 6.4l2.9 2.9' },
  ],
  delete: [
    { d: 'M3.5 6.5h17' },
    { d: 'M8.5 6.5V4.9a1.4 1.4 0 0 1 1.4-1.4h4.2a1.4 1.4 0 0 1 1.4 1.4v1.6' },
    { d: 'M5.8 6.5l.9 12.3a1.8 1.8 0 0 0 1.8 1.7h6.8a1.8 1.8 0 0 0 1.8-1.7l.9-12.3' },
    { d: 'M10 10.6v5.8M14 10.6v5.8' },
  ],
  announce: [
    { d: 'M3.5 10.2a1.6 1.6 0 0 1 1.6-1.6h3L15 4.6v14.8L8.1 15.4h-3a1.6 1.6 0 0 1-1.6-1.6z' },
    { d: 'M18.2 9.4a4 4 0 0 1 0 5.2' },
    { d: 'M8.1 15.4V19' },
  ],
  eye: [
    { d: 'M2.6 12S6 5.8 12 5.8 21.4 12 21.4 12 18 18.2 12 18.2 2.6 12 2.6 12z' },
    { c: [12, 12, 3.1] },
  ],
  check: [
    { d: 'M5 12.6l4.6 4.6L19 6.6' },
  ],
  reject: [
    { c: [12, 12, 8.5] },
    { d: 'M9 9l6 6M15 9l-6 6' },
  ],
  close: [
    { d: 'M6.5 6.5l11 11M17.5 6.5l-11 11' },
  ],
  chevronLeft: [
    { d: 'M14.5 5.5 8 12l6.5 6.5' },
  ],
  chevronRight: [
    { d: 'M9.5 5.5 16 12l-6.5 6.5' },
  ],
  chevronDown: [
    { d: 'M5.5 9.5 12 16l6.5-6.5' },
  ],
  upload: [
    { d: 'M12 15.5V3.8' },
    { d: 'M8 7.6 12 3.6l4 4' },
    { d: 'M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15' },
  ],
  info: [
    { c: [12, 12, 8.6] },
    { d: 'M12 11.2v5' },
    { d: 'M12 7.8v.01' },
  ],
  menu: [
    { d: 'M4 7h16M4 12h16M4 17h16' },
  ],
  sun: [
    { c: [12, 12, 4.2] },
    { d: 'M12 2.6v2.2M12 19.2v2.2M2.6 12h2.2M19.2 12h2.2M5.4 5.4 7 7M17 17l1.6 1.6M18.6 5.4 17 7M7 17l-1.6 1.6' },
  ],
  moon: [
    { d: 'M20.4 14.2A8.4 8.4 0 0 1 9.8 3.6a8.4 8.4 0 1 0 10.6 10.6z' },
  ],
  message: [
    { d: 'M4 5.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9.5L5 20.2V16.5H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z' },
  ],

  // Roles
  roleSupporter: [
    { d: 'M6 7.5a6 1.8 0 0 1 12 0a6 1.8 0 0 1-12 0' },
    { d: 'M6 12a6 1.8 0 0 0 12 0' },
    { d: 'M6 16.5a6 1.8 0 0 0 12 0' },
  ],
  roleCreator: [
    { d: 'M5 19l1.2-4.2L15.9 5.1a2 2 0 0 1 2.9 2.9L9.2 16.6 5 19z' },
    { d: 'M14.4 6.6l3 3' },
  ],
  roleAdmin: [
    { d: 'M20.1 10.6L20.1 13.4L17.6 13.4L17 15L18.7 16.7L16.7 18.7L15 17L13.4 17.6L13.4 20.1L10.6 20.1L10.6 17.6L9 17L7.3 18.7L5.3 16.7L7 15L6.4 13.4L3.9 13.4L3.9 10.6L6.4 10.6L7 9L5.3 7.3L7.3 5.3L9 7L10.6 6.4L10.6 3.9L13.4 3.9L13.4 6.4L15 7L16.7 5.3L18.7 7.3L17 9L17.6 10.6z' },
    { c: [12, 12, 3.1] },
  ],
  person: [
    { c: [12, 8, 3.6] },
    { d: 'M4.8 20a7.2 7.2 0 0 1 14.4 0' },
  ],

  // Figures and states
  pending: [
    { c: [12, 12, 8.5] },
    { d: 'M12 7.2V12l3.2 2' },
  ],
  launch: [
    { d: 'M12 2.6c2.9 2.7 4.4 6.4 4.4 10.4v2.4H7.6V13c0-4 1.5-7.7 4.4-10.4z' },
    { c: [12, 9.4, 1.9] },
    { d: 'M7.6 12.6 5 15.8v3.4l3-1.6' },
    { d: 'M16.4 12.6 19 15.8v3.4l-3-1.6' },
    { d: 'M10.3 18.6h3.4L12 21.4l-1.7-2.8z' },
  ],
  supporters: [
    { d: 'M12 20.5l-1.3-1.2C6.4 15.6 3.6 13 3.6 9.9A4.3 4.3 0 0 1 12 7.7a4.3 4.3 0 0 1 8.4 2.2c0 3.1-2.8 5.7-7.1 9.4L12 20.5z' },
  ],
  creators: [
    { c: [12, 12, 8.5] },
    { c: [12, 12, 4.2] },
    { d: 'M11.2 12a0.8 0.8 0 1 0 1.6 0a0.8 0.8 0 1 0-1.6 0' },
  ],
  payouts: [
    { d: 'M4.5 6.5h15a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-15a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z' },
    { c: [12, 12, 2.6] },
    { d: 'M6.5 9.5v5' },
    { d: 'M17.5 9.5v5' },
  ],
  notifications: [
    { d: 'M18 16.5v-5.2a6 6 0 0 0-12 0v5.2L4.2 19h15.6L18 16.5z' },
    { d: 'M10 21a2.2 2.2 0 0 0 4 0' },
  ],
  inbox: [
    { d: 'M4.5 13.5 6 6h12l1.5 7.5V18a2 2 0 0 1-2 2h-12a2 2 0 0 1-2-2v-4.5z' },
    { d: 'M4.5 13.5H9l1.5 2.5h3L15 13.5h4.5' },
  ],
  warning: [
    { d: 'M12 4.2 21 19.8H3L12 4.2z' },
    { d: 'M12 10v4' },
    { d: 'M12 16.8v.01' },
  ],
  shield: [
    { d: 'M12 3.2 20 6v5.4c0 4.6-3.2 8.2-8 9.4-4.8-1.2-8-4.8-8-9.4V6l8-2.8z' },
  ],
  goal: [
    { c: [12, 12, 7.8] },
    { c: [12, 12, 3] },
    { d: 'M12 12 21 3' },
    { d: 'M21 3h-4.6M21 3v4.6' },
  ],
  gift: [
    { d: 'M4.5 11.5h15v8a1.5 1.5 0 0 1-1.5 1.5H6a1.5 1.5 0 0 1-1.5-1.5v-8z' },
    { d: 'M3.5 8.2h17v3.3h-17z' },
    { d: 'M12 8.2v12.8' },
    { d: 'M12 8.2C10.7 5.6 9.3 4 7.9 4a2.1 2.1 0 0 0 0 4.2z' },
    { d: 'M12 8.2c1.3-2.6 2.7-4.2 4.1-4.2a2.1 2.1 0 0 1 0 4.2z' },
  ],
  wave: [
    { d: 'M8.4 13V6.2a1.3 1.3 0 0 1 2.6 0v4.9' },
    { d: 'M11 11.1V3.9a1.3 1.3 0 0 1 2.6 0v7.2' },
    { d: 'M13.6 11.1V6.6a1.3 1.3 0 0 1 2.6 0v6.3' },
    { d: 'M8.4 13v-1.2a1.3 1.3 0 0 0-2.6 0v5.1a5 5 0 0 0 1.4 3.4l1.2 1.2a3.4 3.4 0 0 0 2.4 1h1.5a2.6 2.6 0 0 0 2.6-2.6v-3.9' },
    { d: 'M19.4 3.8 20.7 2.6M20.2 8.2h1.9' },
  ],
  crown: [
    { d: 'M3.8 7.6 8 11.2 12 4.2l4 7 4.2-3.6-1.6 9.4H5.4L3.8 7.6z' },
  ],
  calendar: [
    { d: 'M4.5 6.8h15a1 1 0 0 1 1 1v10.7a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V7.8a1 1 0 0 1 1-1z' },
    { d: 'M3.5 10.6h17' },
    { d: 'M8 4.4v3.4M16 4.4v3.4' },
  ],
  image: [
    { d: 'M4.5 5h15a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z' },
    { c: [8.8, 9.6, 1.6] },
    { d: 'M3.5 16.6 8.4 12l3.4 3.1 2.8-2.4 5.9 4.9' },
  ],
};

// Every name the registry answers to, so a typo in a call site is catchable
// without rendering the page.
const ICON_NAMES = Object.keys(ICONS);

export default function Icon({ name, label, className }) {
  const glyph = ICONS[name];
  if (!glyph) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      width="24"
      height="24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      role={label ? 'img' : undefined}
      aria-label={label || undefined}
      aria-hidden={label ? undefined : 'true'}
      className={cn('shrink-0', className)}
    >
      {glyph.map((shape, index) =>
        shape.c ? (
          <circle key={index} cx={shape.c[0]} cy={shape.c[1]} r={shape.c[2]} />
        ) : (
          <path key={index} d={shape.d} />
        )
      )}
    </svg>
  );
}

export { ICONS, ICON_NAMES };
