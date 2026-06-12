import ActivityHeatmap from '@/components/stats/ActivityHeatmap';
import BadgeCollection from '@/components/stats/BadgeCollection';
import BodyMap from '@/components/stats/BodyMap';
import ExerciseProgressChart from '@/components/stats/ExerciseProgressChart';
import LifetimeVolumeCard from '@/components/stats/LifetimeVolumeCard';
import VolumeChart from '@/components/stats/VolumeChart';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import {
  buildDailyCounts,
  buildExerciseProgressions,
  buildMilestoneProgress,
  buildMilestoneStats,
  buildMuscleBalanceByPeriod,
  buildWorkoutVolumes,
  findNextMilestone,
} from '@/lib/workout/aggregate';
import { getExercises, getWorkoutEntries } from '@/lib/workout/data';

type Props = {
  lang: Locale;
  dict: Dictionary;
  accessToken: string;
};

const HEATMAP_WEEKS = 12;

const CARD_CLASS =
  'rounded-2xl border border-black/[.08] bg-white p-4 sm:p-5 dark:border-white/[.145] dark:bg-zinc-900';
const HEADING_CLASS = 'mb-4 text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50';

export default async function StatsSection({ lang, dict, accessToken }: Props) {
  const t = dict.stats;
  const [entriesResult, exercisesResult] = await Promise.all([
    getWorkoutEntries(accessToken),
    getExercises(accessToken),
  ]);

  if (entriesResult.error) {
    return (
      <section>
        <h2 className={HEADING_CLASS}>{t.title}</h2>
        <p className="text-sm text-rose-500">{t.loadFailed}</p>
      </section>
    );
  }

  const entries = entriesResult.entries;
  if (entries.length === 0) {
    return (
      <section>
        <h2 className={HEADING_CLASS}>{t.title}</h2>
        <p className="text-zinc-600 dark:text-zinc-400">{t.empty}</p>
      </section>
    );
  }

  const workouts = entries.map(({ workout }) => workout);
  const exerciseById = exercisesResult.exerciseById;
  const dailyCounts = buildDailyCounts(workouts, HEATMAP_WEEKS);
  const workoutVolumes = buildWorkoutVolumes(entries);
  const exerciseProgressions = buildExerciseProgressions(entries, exerciseById);
  const muscleBalance = buildMuscleBalanceByPeriod(entries, exerciseById, new Date());
  const lifetimeVolume = workoutVolumes.reduce((sum, w) => sum + w.volume, 0);
  const milestoneProgress = buildMilestoneProgress(buildMilestoneStats(entries));
  const nextMilestone = findNextMilestone(milestoneProgress);
  const detailFailures = entriesResult.failures;
  const exercisesFailed = !!exercisesResult.error;

  return (
    <div className="flex flex-col gap-6">
      <h2 className="text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
        {t.title}
      </h2>

      <LifetimeVolumeCard total={lifetimeVolume} lang={lang} dict={t.lifetimeVolume} />

      <section id="badges" className={CARD_CLASS}>
        <h3 className={HEADING_CLASS}>{t.badges.heading}</h3>
        {detailFailures > 0 && <p className="mb-3 text-xs text-rose-500">{t.detailPartialFailure}</p>}
        <BadgeCollection progress={milestoneProgress} next={nextMilestone} lang={lang} dict={t.badges} />
      </section>

      <section className={CARD_CLASS}>
        <h3 className={HEADING_CLASS}>{t.activityHeading}</h3>
        <ActivityHeatmap data={dailyCounts} lang={lang} dict={t.heatmap} />
      </section>

      <section className={CARD_CLASS}>
        <h3 className={HEADING_CLASS}>{t.volumeHeading}</h3>
        {detailFailures > 0 && <p className="mb-3 text-xs text-rose-500">{t.detailPartialFailure}</p>}
        <VolumeChart data={workoutVolumes} lang={lang} dict={t.volume} />
      </section>

      <section className={CARD_CLASS}>
        <h3 className={HEADING_CLASS}>{t.progressionHeading}</h3>
        {detailFailures > 0 && <p className="mb-3 text-xs text-rose-500">{t.detailPartialFailure}</p>}
        <ExerciseProgressChart series={exerciseProgressions} lang={lang} dict={t.progression} />
      </section>

      <section className={CARD_CLASS}>
        <h3 className={HEADING_CLASS}>{t.muscleBalanceHeading}</h3>
        {exercisesFailed && <p className="mb-3 text-xs text-rose-500">{t.muscleBalanceLoadFailed}</p>}
        <BodyMap byPeriod={muscleBalance} lang={lang} dict={t.muscleBalance} />
      </section>
    </div>
  );
}
