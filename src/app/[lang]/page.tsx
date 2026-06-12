import LoginLink from '@/components/LoginLink';
import { isLocale } from '@/i18n/config';
import { translate } from '@/i18n/format';
import { getDictionary } from '@/i18n/getDictionary';
import { getAccessToken, getCurrentUser } from '@/lib/session';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';
import ActiveWorkoutSection from './_dashboard/ActiveWorkoutSection';
import FinishedWorkoutSummary from './_dashboard/FinishedWorkoutSummary';
import HeroSection from './_dashboard/HeroSection';
import HistorySection from './_dashboard/HistorySection';
import { CardSkeleton, HeroSkeleton, StatsSkeleton } from './_dashboard/Skeletons';
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
  const user = await getCurrentUser();
  const accessToken = user ? await getAccessToken() : null;

  if (!user || !accessToken) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-12 sm:px-6 sm:py-16 dark:bg-black">
        <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            {dict.home.welcome}
          </h1>
          <p className="text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
            {dict.home.ctaLoggedOut}
          </p>
          <LoginLink className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]">
            {dict.common.login}
          </LoginLink>
        </div>
      </main>
    );
  }

  const { error: errorParam, finished: finishedParam } = await searchParams;

  return (
    <main className="flex flex-1 flex-col items-center bg-zinc-50 px-4 py-8 sm:px-6 sm:py-12 dark:bg-black">
      <div className="flex w-full max-w-3xl flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
            {dict.home.welcome}
          </h1>
          <p className="text-sm text-zinc-700 sm:text-base dark:text-zinc-300">
            {translate(lang, dict.home.signedInAs, { name: user.displayName ?? '' })}
          </p>
        </div>

        {errorParam === 'start_failed' && (
          <p className="text-sm text-rose-500">{dict.workouts.startFailed}</p>
        )}
        {errorParam === 'finish_failed' && (
          <p className="text-sm text-rose-500">{dict.workoutDetail.finishFailed}</p>
        )}

        <Suspense fallback={<HeroSkeleton />}>
          <HeroSection lang={lang} dict={dict} accessToken={accessToken} />
        </Suspense>

        <Suspense fallback={<CardSkeleton />}>
          <ActiveWorkoutSection lang={lang} dict={dict} accessToken={accessToken} />
        </Suspense>

        <Suspense fallback={<CardSkeleton />}>
          <HistorySection lang={lang} dict={dict} accessToken={accessToken} />
        </Suspense>

        <Suspense fallback={<StatsSkeleton />}>
          <StatsSection lang={lang} dict={dict} accessToken={accessToken} />
        </Suspense>

        {!!finishedParam && (
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
