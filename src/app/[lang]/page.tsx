import { client as workoutClient } from '@/app/api/workout/client';
import LoginLink from '@/components/LoginLink';
import { isLocale } from '@/i18n/config';
import { translate } from '@/i18n/format';
import { getDictionary } from '@/i18n/getDictionary';
import { getAccessToken, getCurrentUser } from '@/lib/session';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  buildMilestoneProgressForAxes,
  computeCurrentStreak,
  computeLongestStreak,
  countWorkoutsSince,
  findNextMilestone,
} from './(workout)/workouts/stats/aggregate';
import HomeDashboard from './HomeDashboard';

export default async function Home({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);
  const user = await getCurrentUser();
  const accessToken = user ? await getAccessToken() : null;

  let dashboard = null;
  if (user && accessToken) {
    const listResult = await workoutClient.GET('/v1/workouts', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (listResult.error) {
      dashboard = (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">{dict.home.dashboard.loadFailed}</p>
      );
    } else {
      const workouts = listResult.data?.workouts ?? [];
      if (workouts.length === 0) {
        dashboard = (
          <div className="w-full rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 dark:border-white/[.145] dark:bg-zinc-900">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">{dict.home.dashboard.empty}</p>
          </div>
        );
      } else {
        const next = findNextMilestone(
          buildMilestoneProgressForAxes(
            {
              workoutCount: workouts.length,
              streakDays: computeLongestStreak(workouts),
            },
            ['workoutCount', 'streakDays'],
          ),
        );
        dashboard = (
          <HomeDashboard
            lang={lang}
            dict={dict.home.dashboard}
            badgesDict={dict.stats.badges}
            currentStreak={computeCurrentStreak(workouts)}
            weekCount={countWorkoutsSince(workouts, 7)}
            next={next}
          />
        );
      }
    }
  }

  return (
    <main className="flex flex-1 flex-col items-center justify-center bg-zinc-50 px-4 py-12 sm:px-6 sm:py-16 dark:bg-black">
      <div className="flex w-full max-w-2xl flex-col items-center gap-6 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 sm:text-3xl dark:text-zinc-50">
          {dict.home.welcome}
        </h1>
        {user ? (
          <>
            <p className="text-sm text-zinc-700 sm:text-base dark:text-zinc-300">
              {translate(lang, dict.home.signedInAs, { name: user.displayName ?? '' })}
            </p>
            {dashboard}
            <Link
              href={`/${lang}/workouts`}
              className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
            >
              {dict.home.ctaLoggedIn}
            </Link>
          </>
        ) : (
          <>
            <p className="text-sm text-zinc-600 sm:text-base dark:text-zinc-400">
              {dict.home.ctaLoggedOut}
            </p>
            <LoginLink className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-foreground px-6 py-2 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]">
              {dict.common.login}
            </LoginLink>
          </>
        )}
      </div>
    </main>
  );
}
