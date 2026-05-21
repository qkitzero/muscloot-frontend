import { client as exerciseClient } from '@/app/api/exercise/client';
import { client as workoutClient } from '@/app/api/workout/client';
import ExerciseImage from '@/components/ExerciseImage';
import FormattedDateTime from '@/components/FormattedDateTime';
import { getAccessToken } from '@/lib/session';
import Link from 'next/link';
import type { components as exerciseSchema } from '../../../../../gen/exercise/v1/exercise.schema';
import type { components as workoutSchema } from '../../../../../gen/workout/v1/workout.schema';
import AddSetForm from './AddSetForm';
import { finishWorkout } from './actions';

type Workout = workoutSchema['schemas']['v1Workout'];
type Set = workoutSchema['schemas']['v1Set'];
type Exercise = exerciseSchema['schemas']['v1Exercise'];

function exerciseFor(set: Set, byId: Map<string, Exercise>): Exercise | undefined {
  if (!set.exerciseId) return undefined;
  return byId.get(set.exerciseId);
}

function exerciseLabel(set: Set, byId: Map<string, Exercise>): string {
  if (!set.exerciseId) return 'Unknown exercise';
  const exercise = byId.get(set.exerciseId);
  return exercise?.name ?? exercise?.code ?? set.exerciseId;
}

export default async function WorkoutDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ workoutId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { workoutId } = await params;
  const { error: errorParam } = await searchParams;

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
        <div className="flex w-full max-w-2xl flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Workout</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Sign in to view this workout.</p>
          <a
            href="/api/auth/login"
            className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            Login
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
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Workout</h1>
          <p className="text-rose-500">Failed to load workout.</p>
          <Link
            href="/workouts"
            className="rounded-full border border-black/[.08] px-5 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            Back to workouts
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

  const boundFinish = finishWorkout.bind(null, workoutId);

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link
            href="/workouts"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Back
          </Link>
          <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {isFinished ? 'Finished' : 'In progress'}
          </span>
        </div>

        <section className="rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-900">
          <h1 className="mb-3 text-xl font-semibold text-zinc-900 dark:text-zinc-50">
            Workout details
          </h1>
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-zinc-500 dark:text-zinc-400">Started</dt>
            <dd className="text-zinc-900 dark:text-zinc-50">
              <FormattedDateTime value={workout.startedAt} />
            </dd>
            <dt className="text-zinc-500 dark:text-zinc-400">Finished</dt>
            <dd className="text-zinc-900 dark:text-zinc-50">
              <FormattedDateTime value={workout.finishedAt} />
            </dd>
          </dl>
        </section>

        {errorParam === 'finish_failed' && (
          <p className="text-sm text-rose-500">Failed to finish workout. Please try again.</p>
        )}

        <section className="rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Sets</h2>
          {sets.length === 0 ? (
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No sets recorded yet.</p>
          ) : (
            <ul className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
              {sets.map((set) => {
                const exercise = exerciseFor(set, exerciseById);
                const label = exerciseLabel(set, exerciseById);
                return (
                  <li key={set.setId} className="flex items-center gap-3 py-2 text-sm">
                    <ExerciseImage code={exercise?.code} name={label} className="h-12 w-12" />
                    <span className="flex-1 text-zinc-900 dark:text-zinc-50">{label}</span>
                    <span className="text-zinc-600 dark:text-zinc-400">
                      {set.rep ?? 0} reps × {set.weight ?? 0} kg
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-500">
                      <FormattedDateTime value={set.trainedAt} />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {!isFinished && (
          <section className="rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-900">
            <h2 className="mb-3 text-lg font-semibold text-zinc-900 dark:text-zinc-50">Add set</h2>
            <AddSetForm workoutId={workoutId} exercises={exercises} disabled={isFinished} />
            {exercisesResult.error && (
              <p className="mt-2 text-sm text-rose-500">Failed to load exercises.</p>
            )}
          </section>
        )}

        {!isFinished && (
          <form action={boundFinish}>
            <button
              type="submit"
              className="w-full rounded-full border border-black/[.08] bg-white py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
            >
              Finish workout
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
