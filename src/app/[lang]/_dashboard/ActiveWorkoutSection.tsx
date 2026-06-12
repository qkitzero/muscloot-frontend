import FormattedDateTime from '@/components/FormattedDateTime';
import AddSetForm from '@/components/workout/AddSetForm';
import SetList from '@/components/workout/SetList';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { finishWorkout, startWorkout } from '@/lib/workout/actions';
import { findActiveWorkout, getAllSets, getExercises, getWorkoutDetail, getWorkouts } from '@/lib/workout/data';
import { computePrFlags, type PrFlags } from '@/lib/workout/records';

type Props = {
  lang: Locale;
  dict: Dictionary;
  accessToken: string;
};

const CARD_CLASS =
  'rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 dark:border-white/[.145] dark:bg-zinc-900';

export default async function ActiveWorkoutSection({ lang, dict, accessToken }: Props) {
  const { workouts, error } = await getWorkouts(accessToken);
  if (error) return null;

  const active = findActiveWorkout(workouts);

  if (!active?.workoutId) {
    return (
      <section className={CARD_CLASS}>
        <form action={startWorkout.bind(null, lang)}>
          <button
            type="submit"
            className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            {dict.workouts.start}
          </button>
        </form>
      </section>
    );
  }

  const workoutId = active.workoutId;
  const t = dict.workoutDetail;
  const [detail, exercisesResult, allSets] = await Promise.all([
    getWorkoutDetail(accessToken, workoutId),
    getExercises(accessToken),
    getAllSets(accessToken),
  ]);

  if (detail.error || !detail.workout) {
    return (
      <section className={CARD_CLASS}>
        <h2 className="mb-3 text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
          {dict.home.activeWorkout.heading}
        </h2>
        <p className="text-sm text-rose-500">{t.loadFailed}</p>
      </section>
    );
  }

  const prFlagsById = allSets.error ? new Map<string, PrFlags>() : computePrFlags(allSets.sets);

  return (
    <section className={CARD_CLASS}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
          {dict.home.activeWorkout.heading}
        </h2>
        <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {dict.workouts.status.inProgress}
        </span>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {dict.workouts.startedPrefix}
        <FormattedDateTime value={detail.workout.startedAt} lang={lang} />
      </p>

      <div className="mt-4">
        <SetList
          sets={detail.sets}
          exerciseById={exercisesResult.exerciseById}
          prFlagsById={prFlagsById}
          lang={lang}
          dict={t}
          kgUnit={dict.units.kg}
        />
      </div>

      <div className="mt-4 border-t border-black/[.06] pt-4 dark:border-white/[.08]">
        <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {t.addSetHeading}
        </h3>
        <AddSetForm
          workoutId={workoutId}
          exercises={exercisesResult.exercises}
          disabled={false}
          dict={dict.addSet}
          kgUnit={dict.units.kg}
          prLabels={{ weight: t.prBadgeWeight, volume: t.prBadgeVolume }}
        />
        {!!exercisesResult.error && (
          <p className="mt-2 text-sm text-rose-500">{t.loadExercisesFailed}</p>
        )}
      </div>

      <form action={finishWorkout.bind(null, lang, workoutId, 'home')} className="mt-4">
        <button
          type="submit"
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-black/[.08] bg-white py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
        >
          {t.finishButton}
        </button>
      </form>
    </section>
  );
}
