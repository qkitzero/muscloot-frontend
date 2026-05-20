'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

export default function FormattedDateTime({
  value,
  fallback = '—',
}: {
  value?: string;
  fallback?: string;
}) {
  const formatted = useSyncExternalStore(
    subscribe,
    () => {
      if (!value) return fallback;
      const date = new Date(value);
      if (Number.isNaN(date.getTime())) return fallback;
      return date.toLocaleString();
    },
    () => fallback,
  );

  return <span suppressHydrationWarning>{formatted}</span>;
}
