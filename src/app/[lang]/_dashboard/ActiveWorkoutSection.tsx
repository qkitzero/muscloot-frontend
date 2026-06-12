import FormattedDateTime from '@/components/FormattedDateTime';
import AddSetForm from '@/components/workout/AddSetForm';
import PendingButton from '@/components/workout/PendingButton';
import SetList from '@/components/workout/SetList';
import type { Locale } from '@/i18n/config';
import { translate } from '@/i18n/format';
import type { Dictionary } from '@/i18n/getDictionary';
import { finishWorkout, startWorkout } from '@/lib/workout/actions';
import {
  compareIsoDesc,
  findActiveWorkout,
  getAllSets,
  getExercises,
  getWorkoutDetail,
  getWorkouts,
} from '@/lib/workout/data';
import { computePrFlags, type PrFlags } from '@/lib/workout/records';
import type { components as exerciseSchema } from '../../../../gen/exercise/v1/exercise.schema';
import type { components as workoutSchema } from '../../../../gen/workout/v1/workout.schema';

type Workout = workoutSchema['schemas']['v1Workout'];
type Set = workoutSchema['schemas']['v1Set'];
type Exercise = exerciseSchema['schemas']['v1Exercise'];

type Props = {
  lang: Locale;
  dict: Dictionary;
  accessToken: string | null;
};

const CARD_CLASS =
  'flex flex-col rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 lg:h-[28rem] dark:border-white/[.145] dark:bg-zinc-900';

function daysSinceLastWorkout(workouts: Workout[], now: Date): number | null {
  const latest = workouts
    .filter((workout) => !!workout.startedAt)
    .sort((a, b) => compareIsoDesc(a.startedAt, b.startedAt))[0];
  if (!latest?.startedAt) return null;
  const last = new Date(latest.startedAt);
  last.setHours(0, 0, 0, 0);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  return Math.max(0, Math.round((today.getTime() - last.getTime()) / 86400000));
}

function sortByRecentUse(exercises: Exercise[], sets: Set[]): Exercise[] {
  const lastUsedAt = new Map<string, string>();
  for (const set of sets) {
    if (!set.exerciseId || !set.trainedAt) continue;
    if ((lastUsedAt.get(set.exerciseId) ?? '') < set.trainedAt) {
      lastUsedAt.set(set.exerciseId, set.trainedAt);
    }
  }
  const used = exercises
    .filter((exercise) => !!exercise.exerciseId && lastUsedAt.has(exercise.exerciseId))
    .sort((a, b) => compareIsoDesc(lastUsedAt.get(a.exerciseId!), lastUsedAt.get(b.exerciseId!)));
  const unused = exercises.filter(
    (exercise) => !exercise.exerciseId || !lastUsedAt.has(exercise.exerciseId),
  );
  return [...used, ...unused];
}

export default async function ActiveWorkoutSection({ lang, dict, accessToken }: Props) {
  const { workouts, error } = await getWorkouts(accessToken);
  if (error) {
    return (
      <section className={CARD_CLASS}>
        <h2 className="mb-3 text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
          {dict.home.activeWorkout.heading}
        </h2>
        <p className="text-sm text-rose-500">{dict.workouts.loadFailed}</p>
      </section>
    );
  }

  const active = findActiveWorkout(workouts);

  if (!active?.workoutId) {
    const days = daysSinceLastWorkout(workouts, new Date());
    const subtext =
      days === null
        ? dict.home.activeWorkout.emptyNoHistory
        : days === 0
          ? dict.home.activeWorkout.emptyTrainedToday
          : translate(lang, dict.home.activeWorkout.emptyLastWorkout, { days });
    return (
      <section className={CARD_CLASS}>
        <div className="flex flex-1 flex-col items-center justify-center gap-3 py-6 text-center">
          <span aria-hidden className="text-4xl">
            🏋️
          </span>
          <h2 className="text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
            {dict.home.activeWorkout.emptyHeading}
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{subtext}</p>
          <form action={startWorkout.bind(null, lang)} className="mt-2">
            <PendingButton
              pendingLabel={dict.workouts.starting}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-foreground px-8 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] disabled:opacity-50 dark:hover:bg-[#ccc]"
            >
              {dict.workouts.start}
            </PendingButton>
          </form>
        </div>
      </section>
    );
  }

  const workoutId = active.workoutId;
  const t = dict.workoutDetail;
  const [detail, exercisesResult, allSets] = await Promise.all([
    getWorkoutDetail(accessToken, workoutId),
    getExercises(accessToken, lang),
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
  const sortedSets = [...detail.sets].sort((a, b) => compareIsoDesc(a.trainedAt, b.trainedAt));
  const sortedExercises = allSets.error
    ? exercisesResult.exercises
    : sortByRecentUse(exercisesResult.exercises, allSets.sets);

  return (
    <section className={CARD_CLASS}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <h2 className="text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
          {dict.home.activeWorkout.heading}
        </h2>
        <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
          {dict.workouts.status.inProgress}
        </span>
        <span className="text-xs text-zinc-500 sm:ml-auto dark:text-zinc-400">
          {dict.workouts.startedPrefix}
          <FormattedDateTime value={detail.workout.startedAt} lang={lang} />
        </span>
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <div className="max-h-64 min-h-0 overflow-y-auto pr-1 lg:max-h-none lg:flex-1">
          <SetList
            sets={sortedSets}
            exerciseById={exercisesResult.exerciseById}
            prFlagsById={prFlagsById}
            lang={lang}
            dict={t}
            kgUnit={dict.units.kg}
          />
        </div>

        <div className="flex min-h-0 flex-col max-lg:border-t max-lg:border-black/[.06] max-lg:pt-4 lg:w-[24rem] lg:shrink-0 lg:overflow-y-auto lg:border-l lg:border-black/[.06] lg:pl-5 dark:max-lg:border-white/[.08] dark:lg:border-white/[.08]">
          <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {t.addSetHeading}
          </h3>
          <AddSetForm
            workoutId={workoutId}
            exercises={sortedExercises}
            disabled={false}
            dict={dict.addSet}
            kgUnit={dict.units.kg}
            prLabels={{ weight: t.prBadgeWeight, volume: t.prBadgeVolume }}
          />
          {!!exercisesResult.error && (
            <p className="mt-2 text-sm text-rose-500">{t.loadExercisesFailed}</p>
          )}
        </div>
      </div>

      <form action={finishWorkout.bind(null, lang, workoutId, 'home')} className="mt-4">
        <PendingButton
          pendingLabel={t.finishing}
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-black/[.08] bg-white py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
        >
          {t.finishButton}
        </PendingButton>
      </form>
    </section>
  );
}
