/**
 * Single source of truth for the primary destinations, shared by the desktop
 * nav row (`nav.tsx`) and the mobile hamburger menu (`mobile-menu.tsx`). Kept
 * in its own module — free of server-only imports — so the client menu can
 * import it without dragging server code into the client bundle.
 */
export const NAV_LINKS = [
  { href: '/', label: 'Dashboard' },
  { href: '/teams', label: 'Teams' },
  { href: '/players', label: 'Players' },
] as const;
