import FormattedDateTime from '@/components/FormattedDateTime';
import type { Locale } from '@/i18n/config';
import { translate } from '@/i18n/format';
import type { Dictionary } from '@/i18n/getDictionary';
import { findActiveWorkout, getWorkouts } from '@/lib/workout/data';
import Link from 'next/link';
import type { components } from '../../../../gen/workout/v1/workout.schema';

type Workout = components['schemas']['v1Workout'];

type Props = {
  lang: Locale;
  dict: Dictionary;
  accessToken: string;
};

const VISIBLE_COUNT = 5;

function HistoryItem({
  workout,
  lang,
  dict,
}: {
  workout: Workout;
  lang: Locale;
  dict: Dictionary;
}) {
  const statusLabel = workout.finishedAt
    ? dict.workouts.status.finished
    : dict.workouts.status.inProgress;
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <Link
        href={`/${lang}/workouts/${workout.workoutId}`}
        className="flex items-center justify-between gap-3"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
            {dict.workouts.startedPrefix}
            <FormattedDateTime value={workout.startedAt} lang={lang} />
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400">
            {dict.workouts.finishedPrefix}
            <FormattedDateTime value={workout.finishedAt} lang={lang} />
          </span>
        </div>
        <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {statusLabel}
        </span>
      </Link>
    </li>
  );
}

export default async function HistorySection({ lang, dict, accessToken }: Props) {
  const { workouts, error } = await getWorkouts(accessToken);
  if (error) return null;

  const active = findActiveWorkout(workouts);
  const past = workouts.filter(
    (workout) => !!workout.workoutId && workout.workoutId !== active?.workoutId,
  );
  if (past.length === 0) return null;

  const visible = past.slice(0, VISIBLE_COUNT);
  const older = past.slice(VISIBLE_COUNT);

  return (
    <section className="rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 dark:border-white/[.145] dark:bg-zinc-900">
      <h2 className="mb-3 text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
        {dict.home.history.heading}
      </h2>
      <ul className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
        {visible.map((workout) => (
          <HistoryItem key={workout.workoutId} workout={workout} lang={lang} dict={dict} />
        ))}
      </ul>
      {older.length > 0 && (
        <details className="mt-3">
          <summary className="cursor-pointer text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50">
            {translate(lang, dict.home.history.showOlder, { count: older.length })}
          </summary>
          <ul className="mt-3 flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
            {older.map((workout) => (
              <HistoryItem key={workout.workoutId} workout={workout} lang={lang} dict={dict} />
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
