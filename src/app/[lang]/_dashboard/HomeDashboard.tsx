import type { Locale } from '@/i18n/config';
import { formatNumber, translate } from '@/i18n/format';
import type { Dictionary } from '@/i18n/getDictionary';
import Link from 'next/link';
import type { MilestoneProgress } from '@/lib/workout/aggregate';

type Props = {
  lang: Locale;
  dict: Dictionary['home']['dashboard'];
  badgesDict: Dictionary['stats']['badges'];
  currentStreak: number;
  weekCount: number;
  next: MilestoneProgress | null;
};

const CARD_CLASS =
  'flex min-h-28 flex-col rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 dark:border-white/[.145] dark:bg-zinc-900';

export default function HomeDashboard({
  lang,
  dict,
  badgesDict,
  currentStreak,
  weekCount,
  next,
}: Props) {
  const nextValues = next
    ? {
        threshold:
          next.axis === 'workoutCount' ? next.threshold : formatNumber(lang, next.threshold),
        current: formatNumber(lang, Math.round(next.current)),
      }
    : null;

  return (
    <div className="grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-3 sm:gap-6">
      <section className={CARD_CLASS}>
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {dict.streakHeading}
        </h2>
        {currentStreak > 0 ? (
          <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
            <span aria-hidden>🔥 </span>
            {translate(lang, dict.streakValue, { days: currentStreak })}
          </p>
        ) : (
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{dict.streakNone}</p>
        )}
      </section>

      <section className={CARD_CLASS}>
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">{dict.weekHeading}</h2>
        <p className="mt-2 text-2xl font-semibold tabular-nums text-zinc-900 dark:text-zinc-50">
          <span aria-hidden>🏋️ </span>
          {translate(lang, dict.weekValue, { count: weekCount })}
        </p>
      </section>

      <section className={CARD_CLASS}>
        <h2 className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {dict.milestoneHeading}
        </h2>
        {next && nextValues ? (
          <div className="mt-2 flex flex-col gap-1.5">
            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
              {translate(lang, badgesDict.axes[next.axis].name, nextValues)}
            </p>
            <div className="h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
              <div
                className="h-full rounded-full bg-emerald-500"
                style={{ width: `${Math.round(next.ratio * 100)}%` }}
              />
            </div>
            <p className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
              {translate(lang, badgesDict.axes[next.axis].progress, nextValues)}
            </p>
          </div>
        ) : (
          <div className="mt-2 flex flex-col gap-1.5">
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {dict.milestoneAllDone}
            </p>
            <Link
              href="#badges"
              className="text-xs text-zinc-600 underline hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
            >
              {dict.viewAllBadges}
            </Link>
          </div>
        )}
      </section>
    </div>
  );
}
