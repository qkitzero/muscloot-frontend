import LoginLink from '@/components/LoginLink';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { getAccessToken, getCurrentUser } from '@/lib/session';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ActiveWorkoutSection from './_dashboard/ActiveWorkoutSection';
import FinishedWorkoutSummary from './_dashboard/FinishedWorkoutSummary';
import HeroSection from './_dashboard/HeroSection';
import HistorySection from './_dashboard/HistorySection';
import {
  ActiveCardSkeleton,
  HeroSkeleton,
  HistoryCardSkeleton,
  StatsSkeleton,
} from './_dashboard/Skeletons';
import StatsSection from './_dashboard/StatsSection';

export default async function Home({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<{ error?: string; finished?: string }>;
}) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const sessionToken = await getAccessToken();
  const user = sessionToken ? await getCurrentUser() : null;
  const accessToken = user ? sessionToken : null;
  const sessionExpired = !!sessionToken && !user;
  const { error: errorParam, finished: finishedParam } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-6 sm:px-6 sm:py-8 dark:bg-black">
      <div className="flex w-full max-w-6xl flex-col gap-4 sm:gap-6">
        {sessionExpired && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            {dict.home.session.expired}{' '}
            <LoginLink className="font-medium underline">{dict.common.login}</LoginLink>
          </p>
        )}
        {!user && !sessionExpired && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200">
            {dict.home.demo.banner}
          </p>
        )}

        {errorParam === 'start_failed' && (
          <p className="text-sm text-rose-500">{dict.workouts.startFailed}</p>
        )}
        {errorParam === 'finish_failed' && (
          <p className="text-sm text-rose-500">{dict.workoutDetail.finishFailed}</p>
        )}

        <Suspense fallback={<HeroSkeleton />}>
          <HeroSection lang={lang} dict={dict} accessToken={accessToken} />
        </Suspense>

        <Suspense fallback={<ActiveCardSkeleton />}>
          <ActiveWorkoutSection lang={lang} dict={dict} accessToken={accessToken} />
        </Suspense>

        <Suspense fallback={<StatsSkeleton />}>
          <StatsSection lang={lang} dict={dict} accessToken={accessToken} />
        </Suspense>

        <Suspense fallback={<HistoryCardSkeleton />}>
          <HistorySection lang={lang} dict={dict} accessToken={accessToken} />
        </Suspense>

        {!!user && !!accessToken && !!finishedParam && (
          <Suspense fallback={null}>
            <FinishedWorkoutSummary
              lang={lang}
              dict={dict}
              accessToken={accessToken}
              workoutId={finishedParam}
            />
          </Suspense>
        )}
      </div>
    </main>
  );
}
