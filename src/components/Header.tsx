import LanguageSwitcher from '@/components/LanguageSwitcher';
import LoginLink from '@/components/LoginLink';
import LogoutLink from '@/components/LogoutLink';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { getCurrentUser } from '@/lib/session';
import Link from 'next/link';

export default async function Header({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const user = await getCurrentUser();

  return (
    <header className="sticky top-0 z-20 flex w-full flex-wrap items-center justify-between gap-y-2 border-b border-black/[.08] bg-white/80 px-4 py-3 backdrop-blur sm:px-6 dark:border-white/[.145] dark:bg-black/80">
      <Link
        href={`/${lang}`}
        className="text-base font-bold tracking-tight text-zinc-900 hover:text-zinc-600 sm:text-lg dark:text-zinc-50 dark:hover:text-zinc-300"
      >
        {dict.common.appName}
      </Link>

      <div className="flex flex-wrap items-center justify-end gap-x-3 gap-y-2 sm:gap-3">
        {user ? (
          <>
            <span className="hidden max-w-[10rem] truncate text-sm text-zinc-600 sm:inline-block dark:text-zinc-400">
              {user.displayName}
            </span>
            <LogoutLink className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-solid border-black/[.08] px-4 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] sm:px-5 dark:border-white/[.145] dark:hover:bg-[#1a1a1a]">
              {dict.common.logout}
            </LogoutLink>
          </>
        ) : (
          <LoginLink className="inline-flex min-h-[40px] items-center justify-center rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] sm:px-5 dark:hover:bg-[#ccc]">
            {dict.common.login}
          </LoginLink>
        )}
        <LanguageSwitcher lang={lang} label={dict.language.label} names={dict.language.names} />
      </div>
    </header>
  );
}
