import { isLocale } from '@/i18n/config';
import { translate } from '@/i18n/format';
import { getDictionary } from '@/i18n/getDictionary';
import { getCurrentUser } from '@/lib/session';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const user = await getCurrentUser();

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          {dict.home.welcome}
        </h1>
        {user ? (
          <>
            <p className="text-lg text-zinc-700 dark:text-zinc-300">
              {translate(lang, dict.home.signedInAs, { name: user.displayName ?? '' })}
            </p>
            <Link
              href={`/${lang}/workouts`}
              className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              {dict.home.ctaLoggedIn}
            </Link>
          </>
        ) : (
          <>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">{dict.home.ctaLoggedOut}</p>
            <a
              href="/api/auth/login"
              className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              {dict.common.login}
            </a>
          </>
        )}
      </div>
    </main>
  );
}
