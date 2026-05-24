'use client';

import { locales, type Locale } from '@/i18n/config';
import { usePathname, useRouter } from 'next/navigation';
import { useTransition } from 'react';

const LOCALE_COOKIE = 'NEXT_LOCALE';

export default function LanguageSwitcher({
  lang,
  label,
  names,
}: {
  lang: Locale;
  label: string;
  names: Record<Locale, string>;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleChange = (next: Locale) => {
    if (next === lang) return;
    document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    const segments = pathname.split('/');
    if (segments.length > 1 && (locales as readonly string[]).includes(segments[1] ?? '')) {
      segments[1] = next;
    } else {
      segments.splice(1, 0, next);
    }
    const nextPath = segments.join('/') || `/${next}`;
    startTransition(() => {
      router.push(nextPath);
      router.refresh();
    });
  };

  return (
    <label className="flex items-center gap-1 text-sm text-zinc-600 dark:text-zinc-400">
      <span className="sr-only">{label}</span>
      <select
        aria-label={label}
        value={lang}
        disabled={isPending}
        onChange={(e) => handleChange(e.target.value as Locale)}
        className="rounded-md border border-black/[.08] bg-white px-2 py-1 text-sm text-zinc-700 outline-none focus:border-zinc-400 dark:border-white/[.145] dark:bg-zinc-950 dark:text-zinc-300"
      >
        {locales.map((locale) => (
          <option key={locale} value={locale}>
            {names[locale]}
          </option>
        ))}
      </select>
    </label>
  );
}
