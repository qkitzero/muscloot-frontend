import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import {
  buildMilestoneProgressForAxes,
  computeCurrentStreak,
  computeLongestStreak,
  countWorkoutsSince,
  findNextMilestone,
} from '@/lib/workout/aggregate';
import { getWorkouts } from '@/lib/workout/data';
import HomeDashboard from './HomeDashboard';

type Props = {
  lang: Locale;
  dict: Dictionary;
  accessToken: string;
};

export default async function HeroSection({ lang, dict, accessToken }: Props) {
  const { workouts, error } = await getWorkouts(accessToken);

  if (error) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{dict.home.dashboard.loadFailed}</p>
    );
  }

  if (workouts.length === 0) {
    return (
      <div className="w-full rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 dark:border-white/[.145] dark:bg-zinc-900">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{dict.home.dashboard.empty}</p>
      </div>
    );
  }

  const next = findNextMilestone(
    buildMilestoneProgressForAxes(
      {
        workoutCount: workouts.length,
        streakDays: computeLongestStreak(workouts),
      },
      ['workoutCount', 'streakDays'],
    ),
  );

  return (
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
