import { client as exerciseClient } from '@/app/api/exercise/client';
import { client as workoutClient } from '@/app/api/workout/client';
import ExerciseImage from '@/components/ExerciseImage';
import FormattedDateTime from '@/components/FormattedDateTime';
import { isLocale } from '@/i18n/config';
import { translate } from '@/i18n/format';
import { getDictionary } from '@/i18n/getDictionary';
import { getAccessToken } from '@/lib/session';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { components as exerciseSchema } from '../../../../../../gen/exercise/v1/exercise.schema';
import type { components as workoutSchema } from '../../../../../../gen/workout/v1/workout.schema';
import AddSetForm from './AddSetForm';
import { finishWorkout } from './actions';

type Workout = workoutSchema['schemas']['v1Workout'];
type Set = workoutSchema['schemas']['v1Set'];
type Exercise = exerciseSchema['schemas']['v1Exercise'];

function exerciseFor(set: Set, byId: Map<string, Exercise>): Exercise | undefined {
  if (!set.exerciseId) return undefined;
  return byId.get(set.exerciseId);
}

function exerciseLabel(set: Set, byId: Map<string, Exercise>, unknownLabel: string): string {
  if (!set.exerciseId) return unknownLabel;
  const exercise = byId.get(set.exerciseId);
  return exercise?.name ?? exercise?.code ?? set.exerciseId;
}

export default async function WorkoutDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; workoutId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { lang, workoutId } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.workoutDetail;
  const { error: errorParam } = await searchParams;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
        <div className="flex w-full max-w-2xl flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t.title}</h1>
          <p className="text-zinc-600 dark:text-zinc-400">{t.loginPrompt}</p>
          <a
            href="/api/auth/login"
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            {dict.common.login}
          </a>
        </div>
      </main>
    );
  }

  const [workoutResult, exercisesResult] = await Promise.all([
    workoutClient.GET('/v1/workouts/{workoutId}', {
      params: { path: { workoutId } },
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
    exerciseClient.GET('/v1/exercises', {
      headers: { Authorization: `Bearer ${accessToken}` },
    }),
  ]);

  if (workoutResult.error || !workoutResult.data?.workout) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
        <div className="flex w-full max-w-2xl flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{t.title}</h1>
          <p className="text-rose-500">{t.loadFailed}</p>
          <Link
            href={`/${lang}/workouts`}
            className="rounded-full border border-black/[.08] px-5 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            {t.backToWorkouts}
          </Link>
        </div>
      </main>
    );
  }

  const workout: Workout = workoutResult.data.workout;
  const sets: Set[] = workoutResult.data.sets ?? [];
  const exercises: Exercise[] = exercisesResult.data?.exercises ?? [];
  const exerciseById = new Map<string, Exercise>(
    exercises
      .filter((exercise): exercise is Exercise & { exerciseId: string } => !!exercise.exerciseId)
      .map((exercise) => [exercise.exerciseId, exercise]),
  );
  const isFinished = !!workout.finishedAt;

  const boundFinish = finishWorkout.bind(null, lang, workoutId);

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link
            href={`/${lang}/workouts`}
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← {dict.common.back}
          </Link>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {isFinished ? dict.workouts.status.finished : dict.workouts.status.inProgress}
          </span>
        </div>

        <section className="rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-900">
          <h1 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            {t.detailsHeading}
          </h1>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-zinc-500 dark:text-zinc-400">{t.startedLabel}</dt>
            <dd className="text-zinc-900 dark:text-zinc-50">
              <FormattedDateTime value={workout.startedAt} lang={lang} />
            </dd>
            <dt className="text-zinc-500 dark:text-zinc-400">{t.finishedLabel}</dt>
            <dd className="text-zinc-900 dark:text-zinc-50">
              <FormattedDateTime value={workout.finishedAt} lang={lang} />
            </dd>
          </dl>
        </section>

        {errorParam === 'finish_failed' && (
          <p className="text-sm text-rose-500">{t.finishFailed}</p>
        )}

        <section className="rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
            {t.setsHeading}
          </h2>
          {sets.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{t.setsEmpty}</p>
          ) : (
            <ul className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
              {sets.map((set) => {
                const exercise = exerciseFor(set, exerciseById);
                const label = exerciseLabel(set, exerciseById, t.unknownExercise);
                return (
                  <li key={set.setId} className="flex items-center gap-3 py-2 text-sm">
                    <ExerciseImage code={exercise?.code} name={label} className="h-12 w-12" />
                    <span className="flex-1 text-zinc-900 dark:text-zinc-50">{label}</span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {translate(lang, t.setSummary, {
                        rep: set.rep ?? 0,
                        weight: set.weight ?? 0,
                        unit: dict.units.kg,
                      })}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-500">
                      <FormattedDateTime value={set.trainedAt} lang={lang} />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {!isFinished && (
          <section className="rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-900">
            <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {t.addSetHeading}
            </h2>
            <AddSetForm
              workoutId={workoutId}
              exercises={exercises}
              disabled={isFinished}
              dict={dict.addSet}
              kgUnit={dict.units.kg}
            />
            {exercisesResult.error && (
              <p className="mt-2 text-sm text-rose-500">{t.loadExercisesFailed}</p>
            )}
          </section>
        )}

        {!isFinished && (
          <form action={boundFinish}>
            <button
              type="submit"
              className="w-full rounded-full border border-black/[.08] bg-white py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
            >
              {t.finishButton}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
