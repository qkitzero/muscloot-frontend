import { client as workoutClient } from '@/app/api/workout/client';
import { getAccessToken } from '@/lib/session';
import Link from 'next/link';
import type { components } from '../../../../gen/workout/v1/workout.schema';
import { startWorkout } from './actions';

type Workout = components['schemas']['v1Workout'];

function formatDateTime(value?: string): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function statusLabel(workout: Workout): string {
  return workout.finishedAt ? 'Finished' : 'In progress';
}

export default async function WorkoutsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
        <div className="flex w-full max-w-2xl flex-col items-center gap-4 text-center">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Workouts</h1>
          <p className="text-zinc-600 dark:text-zinc-400">Sign in to view your workouts.</p>
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

  const { data, error } = await workoutClient.GET('/v1/workouts', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const { error: errorParam } = await searchParams;
  const workouts: Workout[] = data?.workouts ?? [];

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-6 py-12 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Workouts</h1>
          <form action={startWorkout}>
            <button
              type="submit"
              className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              Start workout
            </button>
          </form>
        </div>

        {errorParam === 'start_failed' && (
          <p className="text-sm text-rose-500">Failed to start workout. Please try again.</p>
        )}

        {error ? (
          <p className="text-sm text-rose-500">Failed to load workouts.</p>
        ) : workouts.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">
            No workouts yet. Press &ldquo;Start workout&rdquo; to record your first one.
          </p>
        ) : (
          <ul className="flex flex-col gap-3">
            {workouts.map((workout) => (
              <li
                key={workout.workoutId}
                className="rounded-2xl border border-black/[.08] bg-white p-4 dark:border-white/[.145] dark:bg-zinc-900"
              >
                <Link
                  href={`/workouts/${workout.workoutId}`}
                  className="flex items-center justify-between gap-4"
                >
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      Started: {formatDateTime(workout.startedAt)}
                    </span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">
                      Finished: {formatDateTime(workout.finishedAt)}
                    </span>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {statusLabel(workout)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
