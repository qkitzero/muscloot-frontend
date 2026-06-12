import FormattedDateTime from '@/components/FormattedDateTime';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { compareIsoDesc, findActiveWorkout, getWorkouts } from '@/lib/workout/data';
import Link from 'next/link';
import type { components } from '../../../../gen/workout/v1/workout.schema';

type Workout = components['schemas']['v1Workout'];

type Props = {
  lang: Locale;
  dict: Dictionary;
  accessToken: string | null;
};

const CARD_CLASS =
  'flex flex-col rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 dark:border-white/[.145] dark:bg-zinc-900';

function HistoryItem({
  workout,
  lang,
  dict,
  linked,
}: {
  workout: Workout;
  lang: Locale;
  dict: Dictionary;
  linked: boolean;
}) {
  const statusLabel = workout.finishedAt
    ? dict.workouts.status.finished
    : dict.workouts.status.inProgress;
  const content = (
    <>
      <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
        <FormattedDateTime value={workout.startedAt} lang={lang} />
      </span>
      <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
        {statusLabel}
      </span>
    </>
  );
  return (
    <li className="border-b border-black/[.06] dark:border-white/[.08]">
      {linked ? (
        <Link
          href={`/${lang}/workouts/${workout.workoutId}`}
          className="flex items-center justify-between gap-3 rounded-lg py-2.5 hover:bg-black/[.03] dark:hover:bg-white/[.06]"
        >
          {content}
        </Link>
      ) : (
        <div className="flex items-center justify-between gap-3 py-2.5">{content}</div>
      )}
    </li>
  );
}

export default async function HistorySection({ lang, dict, accessToken }: Props) {
  const { workouts, error } = await getWorkouts(accessToken);
  if (error) {
    return (
      <section className={CARD_CLASS}>
        <h2 className="mb-3 text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
          {dict.home.history.heading}
        </h2>
        <p className="text-sm text-rose-500">{dict.workouts.loadFailed}</p>
      </section>
    );
  }

  const linked = accessToken !== null;
  const active = findActiveWorkout(workouts);
  const past = workouts
    .filter((workout) => !!workout.workoutId && workout.workoutId !== active?.workoutId)
    .sort((a, b) => compareIsoDesc(a.startedAt, b.startedAt));

  return (
    <section className={CARD_CLASS}>
      <h2 className="mb-3 text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
        {dict.home.history.heading}
      </h2>
      {past.length === 0 ? (
        <div className="flex items-center justify-center py-6">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{dict.home.history.empty}</p>
        </div>
      ) : (
        <ul className="max-h-72 overflow-y-auto pr-1">
          {past.map((workout) => (
            <HistoryItem
              key={workout.workoutId}
              workout={workout}
              lang={lang}
              dict={dict}
              linked={linked}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
