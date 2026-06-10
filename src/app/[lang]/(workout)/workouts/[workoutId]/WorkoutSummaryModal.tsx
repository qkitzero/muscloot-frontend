'use client';

import type { Locale } from '@/i18n/config';
import { formatNumber, translate } from '@/i18n/format';
import type { Dictionary } from '@/i18n/getDictionary';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { durationParts, type WorkoutSummary } from './summary';

type SummaryDict = Dictionary['workoutDetail']['summary'];

const CONFETTI_PIECES = [
  { className: 'left-[4%] bg-amber-500', delay: '0s', duration: '2.5s' },
  { className: 'left-[12%] bg-emerald-500', delay: '0.4s', duration: '2.9s' },
  { className: 'left-[20%] bg-sky-500', delay: '0.1s', duration: '2.3s' },
  { className: 'left-[28%] bg-rose-500', delay: '0.6s', duration: '2.7s' },
  { className: 'left-[36%] bg-purple-500', delay: '0.2s', duration: '2.4s' },
  { className: 'left-[44%] bg-amber-500', delay: '0.5s', duration: '3s' },
  { className: 'left-[52%] bg-emerald-500', delay: '0s', duration: '2.6s' },
  { className: 'left-[60%] bg-rose-500', delay: '0.3s', duration: '2.2s' },
  { className: 'left-[68%] bg-sky-500', delay: '0.7s', duration: '2.8s' },
  { className: 'left-[76%] bg-purple-500', delay: '0.1s', duration: '2.5s' },
  { className: 'left-[84%] bg-amber-500', delay: '0.4s', duration: '2.3s' },
  { className: 'left-[92%] bg-emerald-500', delay: '0.2s', duration: '2.9s' },
  { className: 'left-[16%] bg-rose-500', delay: '0.9s', duration: '2.6s' },
  { className: 'left-[48%] bg-sky-500', delay: '1.1s', duration: '2.4s' },
  { className: 'left-[80%] bg-purple-500', delay: '0.8s', duration: '2.7s' },
];

function formatDuration(
  lang: Locale,
  dict: SummaryDict,
  durationMs: number | undefined,
  unknownLabel: string,
): string {
  if (durationMs === undefined) return unknownLabel;
  const { hours, minutes } = durationParts(durationMs);
  return hours > 0
    ? translate(lang, dict.durationHoursMinutes, { hours, minutes })
    : translate(lang, dict.durationMinutes, { minutes });
}

export default function WorkoutSummaryModal({
  lang,
  summary,
  dict,
  kgUnit,
  unknownLabel,
  prLabels,
}: {
  lang: Locale;
  summary: WorkoutSummary;
  dict: SummaryDict;
  kgUnit: string;
  unknownLabel: string;
  prLabels: { weight: string; volume: string };
}) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') router.replace(pathname, { scroll: false });
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [router, pathname]);

  const close = () => router.replace(pathname, { scroll: false });

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={(event) => {
        if (event.target === event.currentTarget) close();
      }}
    >
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        {CONFETTI_PIECES.map((piece, index) => (
          <span
            key={index}
            className={`absolute -top-4 h-3 w-2 rounded-[1px] opacity-0 motion-safe:animate-confetti-fall ${piece.className}`}
            style={{ animationDelay: piece.delay, animationDuration: piece.duration }}
          />
        ))}
      </div>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="workout-summary-title"
        className="relative flex w-full max-w-md flex-col gap-5 rounded-2xl border border-black/[.08] bg-white p-6 motion-safe:animate-summary-pop-in dark:border-white/[.145] dark:bg-zinc-900"
      >
        <h2
          id="workout-summary-title"
          className="text-center text-xl font-semibold text-zinc-900 dark:text-zinc-50"
        >
          🎉 {dict.title}
        </h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-zinc-500 dark:text-zinc-400">{dict.durationLabel}</dt>
          <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
            {formatDuration(lang, dict, summary.durationMs, unknownLabel)}
          </dd>
          <dt className="text-zinc-500 dark:text-zinc-400">{dict.setsLabel}</dt>
          <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
            {translate(lang, dict.setsValue, { count: summary.totalSets })}
          </dd>
          <dt className="text-zinc-500 dark:text-zinc-400">{dict.volumeLabel}</dt>
          <dd className="text-right font-medium text-zinc-900 dark:text-zinc-50">
            {translate(lang, dict.volumeValue, {
              volume: formatNumber(lang, summary.totalVolume),
              unit: kgUnit,
            })}
          </dd>
        </dl>
        {summary.prs.length > 0 ? (
          <div className="rounded-xl bg-amber-50 p-3 dark:bg-amber-500/10">
            <h3 className="mb-2 text-sm font-semibold text-amber-800 dark:text-amber-300">
              {dict.prHeading}
            </h3>
            <ul className="flex flex-col gap-1 text-sm">
              {summary.prs.map((pr) => (
                <li key={pr.name} className="flex items-center justify-between gap-2">
                  <span className="min-w-0 flex-1 text-zinc-900 dark:text-zinc-50">{pr.name}</span>
                  <span className="flex shrink-0 items-center gap-0.5 leading-none">
                    {pr.weight && (
                      <span
                        role="img"
                        aria-label={prLabels.weight}
                        title={prLabels.weight}
                        className="text-base"
                      >
                        👑
                      </span>
                    )}
                    {pr.volume && (
                      <span
                        role="img"
                        aria-label={prLabels.volume}
                        title={prLabels.volume}
                        className="text-base"
                      >
                        💪
                      </span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-center text-sm text-zinc-600 dark:text-zinc-400">{dict.prEmpty}</p>
        )}
        <button
          type="button"
          onClick={close}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-foreground py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
        >
          {dict.close}
        </button>
      </div>
    </div>
  );
}
