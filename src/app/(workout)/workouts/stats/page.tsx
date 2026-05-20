import { client as workoutClient } from '@/app/api/workout/client';
import { getAccessToken } from '@/lib/session';
import Link from 'next/link';
import type { components as workoutSchema } from '../../../../../gen/workout/v1/workout.schema';
import ActivityHeatmap from './ActivityHeatmap';
import VolumeChart from './VolumeChart';
import { buildDailyCounts, buildWorkoutVolumes } from './aggregate';

type Workout = workoutSchema['schemas']['v1Workout'];
type Set = workoutSchema['schemas']['v1Set'];

const HEATMAP_WEEKS = 12;

export default async function WorkoutStatsPage() {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
        <div className="flex w-full max-w-2xl flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Workout stats</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Sign in to view your stats.</p>
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

  const listResult = await workoutClient.GET('/v1/workouts', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (listResult.error) {
    return (
      <main className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12 dark:bg-black">
        <div className="flex w-full max-w-3xl flex-col gap-6">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Workout stats</h1>
          <p className="text-sm text-rose-500">Failed to load workouts.</p>
          <Link
            href="/workouts"
            className="self-start text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Back to workouts
          </Link>
        </div>
      </main>
    );
  }

  const workouts: Workout[] = listResult.data?.workouts ?? [];

  const detailResults = await Promise.all(
    workouts
      .filter((workout): workout is Workout & { workoutId: string } => !!workout.workoutId)
      .map((workout) =>
        workoutClient
          .GET('/v1/workouts/{workoutId}', {
            params: { path: { workoutId: workout.workoutId } },
            headers: { Authorization: `Bearer ${accessToken}` },
          })
          .then((result) => ({ workout, result })),
      ),
  );

  const detailEntries: { workout: Workout; sets: Set[] }[] = detailResults.map(
    ({ workout, result }) => ({
      workout: result.data?.workout ?? workout,
      sets: result.data?.sets ?? [],
    }),
  );

  const dailyCounts = buildDailyCounts(workouts, HEATMAP_WEEKS);
  const workoutVolumes = buildWorkoutVolumes(detailEntries);
  const detailFailures = detailResults.filter(({ result }) => !!result.error).length;

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <Link
            href="/workouts"
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← Back to workouts
          </Link>
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Workout stats</h1>
        </div>

        {workouts.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            No workouts to visualize yet. Record your first workout to see your stats.
          </p>
        ) : (
          <>
            <section className="rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-900">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Activity
              </h2>
              <ActivityHeatmap data={dailyCounts} />
            </section>

            <section className="rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.145] dark:bg-zinc-900">
              <h2 className="mb-4 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                Volume per workout
              </h2>
              {detailFailures > 0 && (
                <p className="mb-3 text-xs text-rose-500">
                  Some workouts could not be loaded; volume may be incomplete.
                </p>
              )}
              <VolumeChart data={workoutVolumes} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
