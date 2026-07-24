'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NAV_LINKS } from './nav-links';

/**
 * Mobile-only hamburger for the primary nav. The desktop row (in `Nav`) is
 * hidden below `md`; this takes over there. Closes on navigation, on Escape,
 * and when a link is tapped so it never lingers over the new page.
 */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close whenever the route changes (covers link taps and back/forward).
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <div className="relative md:hidden">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-expanded={open}
        aria-controls="mobile-nav-menu"
        aria-label={open ? 'Close menu' : 'Open menu'}
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-line-800 bg-ink-800 text-slate-300 transition-colors hover:text-white"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden="true"
        >
          {open ? (
            <>
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="17" y2="6" />
              <line x1="3" y1="10" x2="17" y2="10" />
              <line x1="3" y1="14" x2="17" y2="14" />
            </>
          )}
        </svg>
      </button>

      {open ? (
        <>
          {/* Tap-away backdrop */}
          <button
            type="button"
            aria-hidden="true"
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-10 cursor-default"
          />
          <nav
            id="mobile-nav-menu"
            className="absolute right-0 top-full z-20 mt-2 w-48 overflow-hidden rounded-xl border border-line-800 bg-ink-850 shadow-xl"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="block border-b border-line-800 px-4 py-3 text-sm font-semibold text-slate-300 transition-colors last:border-0 hover:bg-ink-800 hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </>
      ) : null}
    </div>
  );
}
