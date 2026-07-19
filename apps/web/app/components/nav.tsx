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
      <span className="text-sm text-slate-600">
        Signed in as <span className="font-medium text-slate-900">{user.name}</span>
      </span>
    );
  } catch {
    return <span className="text-sm text-slate-400">Guest</span>;
  }
}

export function Nav() {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-semibold text-slate-900">
            Props Analyzer
          </Link>
          <nav className="flex items-center gap-4 text-sm font-medium text-slate-600">
            <Link href="/" className="hover:text-slate-900">
              Dashboard
            </Link>
            <Link href="/players" className="hover:text-slate-900">
              Players
            </Link>
          </nav>
        </div>
        <CurrentUserBadge />
      </div>
    </header>
  );
}
