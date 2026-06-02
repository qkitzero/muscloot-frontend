import { client as workoutClient } from '@/app/api/workout/client';
import LoginLink from '@/components/LoginLink';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { getAccessToken } from '@/lib/session';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { components as workoutSchema } from '../../../../../../gen/workout/v1/workout.schema';
import ActivityHeatmap from './ActivityHeatmap';
import LifetimeVolumeCard from './LifetimeVolumeCard';
import VolumeChart from './VolumeChart';
import { buildDailyCounts, buildWorkoutVolumes } from './aggregate';

type Workout = workoutSchema['schemas']['v1Workout'];
type Set = workoutSchema['schemas']['v1Set'];

const HEATMAP_WEEKS = 12;

export default async function WorkoutStatsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.stats;
  const accessToken = await getAccessToken();

  if (!accessToken) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
        <div className="flex w-full max-w-2xl flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">
            {t.title}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400">{t.loginPrompt}</p>
          <LoginLink className="rounded-full bg-foreground px-5 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]">
            {dict.common.login}
          </LoginLink>
        </div>
      </main>
    );
  }

  const listResult = await workoutClient.GET('/v1/workouts', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (listResult.error) {
    return (
      <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-8 sm:px-6 sm:py-12 dark:bg-black">
        <div className="flex w-full max-w-3xl flex-col gap-6">
          <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">
            {t.title}
          </h1>
          <p className="text-sm text-rose-500">{t.loadFailed}</p>
          <Link
            href={`/${lang}/workouts`}
            className="self-start text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← {t.backToWorkouts}
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
  const lifetimeVolume = workoutVolumes.reduce((sum, w) => sum + w.volume, 0);
  const detailFailures = detailResults.filter(({ result }) => !!result.error).length;

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-8 sm:px-6 sm:py-12 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            href={`/${lang}/workouts`}
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← {t.backToWorkouts}
          </Link>
          <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">
            {t.title}
          </h1>
        </div>

        {workouts.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">{t.empty}</p>
        ) : (
          <>
            <LifetimeVolumeCard total={lifetimeVolume} lang={lang} dict={t.lifetimeVolume} />

            <section className="rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 dark:border-white/[.145] dark:bg-zinc-900">
              <h2 className="mb-4 text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
                {t.activityHeading}
              </h2>
              <ActivityHeatmap data={dailyCounts} lang={lang} dict={t.heatmap} />
            </section>

            <section className="rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 dark:border-white/[.145] dark:bg-zinc-900">
              <h2 className="mb-4 text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
                {t.volumeHeading}
              </h2>
              {detailFailures > 0 && (
                <p className="mb-3 text-xs text-rose-500">{t.detailPartialFailure}</p>
              )}
              <VolumeChart data={workoutVolumes} lang={lang} dict={t.volume} />
            </section>
          </>
        )}
      </div>
    </main>
  );
}
