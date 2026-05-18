import { getCurrentUser } from '@/lib/session';
import Link from 'next/link';

export default async function Header() {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-20 flex w-full items-center justify-between border-b border-black/[.08] bg-white/80 px-6 py-3 backdrop-blur dark:border-white/[.145] dark:bg-black/80">
      <Link
        href="/"
        className="text-xl font-bold tracking-tight text-zinc-900 hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-300"
      >
        Muscloot
      </Link>

      <div className="flex items-center gap-3">
        {user ? (
          <>
            <span className="hidden text-sm text-zinc-600 sm:inline dark:text-zinc-400">
              {user.displayName}
            </span>
            <a
              href="/api/auth/logout"
              className="rounded-full border border-solid border-black/[.08] px-5 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
            >
              Logout
            </a>
          </>
        ) : (
          <a
            href="/api/auth/login"
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Login
          </a>
        )}
      </div>
    </header>
  );
}
