import Link from 'next/link';
import { getCurrentUser } from '@props-analyzer/api-client';

/**
 * Authentication is deferred in Phase 1 (see AGENTS.md workflow notes), so
 * this just displays whatever `GET /users/me` returns instead of a real
 * account menu. If the API/DB isn't reachable yet, we degrade to a plain
 * "Guest" label rather than failing the whole layout.
 */
async function CurrentUserBadge() {
  try {
    const user = await getCurrentUser();
    return (
      <span className="flex items-center gap-2 rounded-full border border-line-800 bg-ink-800 py-1.5 pl-3 pr-1 text-sm text-slate-400">
        {user.name}
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-azure-500 text-xs font-bold text-white">
          {user.name.charAt(0)}
        </span>
      </span>
    );
  } catch {
    return (
      <span className="rounded-full border border-line-800 bg-ink-800 px-3 py-1.5 text-sm text-slate-500">
        Guest
      </span>
    );
  }
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="text-sm font-semibold text-slate-400 transition-colors hover:text-white"
    >
      {children}
    </Link>
  );
}

export function Nav() {
  return (
    <header className="sticky top-0 z-10 border-b border-line-800 bg-ink-850/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-baseline gap-0.5">
            <span className="font-display text-xl font-extrabold italic tracking-tight text-white">
              Props
            </span>
            <span className="font-display text-xl font-extrabold italic tracking-tight text-azure-400">
              Analyzer
            </span>
          </Link>
          <nav className="flex items-center gap-6">
            <NavLink href="/">Dashboard</NavLink>
            <NavLink href="/players">Players</NavLink>
          </nav>
        </div>
        <CurrentUserBadge />
      </div>
      <div className="h-0.5 w-full bg-gradient-to-r from-azure-500 via-azure-400 to-gold-500" />
    </header>
  );
}
