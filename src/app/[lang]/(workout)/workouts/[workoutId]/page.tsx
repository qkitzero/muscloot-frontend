import FormattedDateTime from '@/components/FormattedDateTime';
import LoginLink from '@/components/LoginLink';
import AddSetForm from '@/components/workout/AddSetForm';
import PendingButton from '@/components/workout/PendingButton';
import SetList from '@/components/workout/SetList';
import WorkoutSummaryModal from '@/components/workout/WorkoutSummaryModal';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { getAccessToken } from '@/lib/session';
import { finishWorkout } from '@/lib/workout/actions';
import { getAllSets, getExercises, getWorkoutDetail } from '@/lib/workout/data';
import { computePrFlags, type PrFlags } from '@/lib/workout/records';
import { buildWorkoutSummary } from '@/lib/workout/summary';
import Link from 'next/link';
import { notFound } from 'next/navigation';

export default async function WorkoutDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; workoutId: string }>;
  searchParams: Promise<{ error?: string; finished?: string }>;
}) {
  const { lang, workoutId } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const t = dict.workoutDetail;
  const { error: errorParam, finished: finishedParam } = await searchParams;

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

  const [workoutResult, exercisesResult, allSetsResult] = await Promise.all([
    getWorkoutDetail(accessToken, workoutId),
    getExercises(accessToken, lang),
    getAllSets(accessToken),
  ]);

  if (workoutResult.error || !workoutResult.workout) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-6 py-16 dark:bg-black">
        <div className="flex w-full max-w-2xl flex-col items-center gap-4 text-center">
          <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">
            {t.title}
          </h1>
          <p className="text-rose-500">{t.loadFailed}</p>
          <Link
            href={`/${lang}`}
            className="rounded-full border border-black/[.08] px-5 py-2 text-sm font-medium transition-colors hover:bg-black/[.04] dark:border-white/[.145] dark:hover:bg-[#1a1a1a]"
          >
            {dict.common.back}
          </Link>
        </div>
      </main>
    );
  }

  const workout = workoutResult.workout;
  const sets = workoutResult.sets;
  const exercises = exercisesResult.exercises;
  const exerciseById = exercisesResult.exerciseById;
  const prFlagsById = allSetsResult.error
    ? new Map<string, PrFlags>()
    : computePrFlags(allSetsResult.sets);
  const isFinished = !!workout.finishedAt;
  const showSummary = finishedParam === '1' && isFinished;

  const boundFinish = finishWorkout.bind(null, lang, workoutId, 'detail');

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-8 sm:px-6 sm:py-12 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <div className="flex items-center justify-between gap-2">
          <Link
            href={`/${lang}`}
            className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            ← {dict.common.back}
          </Link>
          <span className="shrink-0 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            {isFinished ? dict.workouts.status.finished : dict.workouts.status.inProgress}
          </span>
        </div>

        <section className="rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 dark:border-white/[.145] dark:bg-zinc-900">
          <h1 className="mb-3 text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
            {t.detailsHeading}
          </h1>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm sm:grid-cols-2">
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

        <section className="rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 dark:border-white/[.145] dark:bg-zinc-900">
          <h2 className="mb-3 text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
            {t.setsHeading}
          </h2>
          <SetList
            sets={sets}
            exerciseById={exerciseById}
            prFlagsById={prFlagsById}
            lang={lang}
            dict={t}
            kgUnit={dict.units.kg}
          />
        </section>

        {!isFinished && (
          <section className="rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 dark:border-white/[.145] dark:bg-zinc-900">
            <h2 className="mb-3 text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
              {t.addSetHeading}
            </h2>
            <AddSetForm
              workoutId={workoutId}
              exercises={exercises}
              disabled={isFinished}
              dict={dict.addSet}
              kgUnit={dict.units.kg}
              prLabels={{ weight: t.prBadgeWeight, volume: t.prBadgeVolume }}
            />
            {!!exercisesResult.error && (
              <p className="mt-2 text-sm text-rose-500">{t.loadExercisesFailed}</p>
            )}
          </section>
        )}

        {!isFinished && (
          <form action={boundFinish}>
            <PendingButton
              pendingLabel={t.finishing}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-full border border-black/[.08] bg-white py-2 text-sm font-medium text-zinc-900 transition-colors hover:bg-black/[.04] disabled:opacity-50 dark:border-white/[.145] dark:bg-zinc-900 dark:text-zinc-50 dark:hover:bg-[#1a1a1a]"
            >
              {t.finishButton}
            </PendingButton>
          </form>
        )}
      </div>

      {showSummary && (
        <WorkoutSummaryModal
          lang={lang}
          summary={buildWorkoutSummary(workout, sets, prFlagsById, exerciseById)}
          dict={t.summary}
          kgUnit={dict.units.kg}
          unknownLabel={dict.common.unknown}
          prLabels={{ weight: t.prBadgeWeight, volume: t.prBadgeVolume }}
        />
      )}
    </main>
  );
}
