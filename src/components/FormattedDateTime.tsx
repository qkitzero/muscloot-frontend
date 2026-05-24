'use client';

import { toIntlLocale } from '@/i18n/format';
import type { Locale } from '@/i18n/config';
import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

export default function FormattedDateTime({
  value,
  lang,
  fallback = '—',
}: {
  value?: string;
  lang: Locale;
  fallback?: string;
}) {
  const formatted = useSyncExternalStore(
    subscribe,
    () => {
      if (!value) return fallback;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return fallback;
      return new Intl.DateTimeFormat(toIntlLocale(lang), {
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(date);
    },
    () => fallback,
  );

  return <span suppressHydrationWarning>{formatted}</span>;
}
