import WorkoutSummaryModal from '@/components/workout/WorkoutSummaryModal';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/getDictionary';
import { getAllSets, getExercises, getWorkoutDetail } from '@/lib/workout/data';
import { computePrFlags, type PrFlags } from '@/lib/workout/records';
import { buildWorkoutSummary } from '@/lib/workout/summary';

type Props = {
  lang: Locale;
  dict: Dictionary;
  accessToken: string;
  workoutId: string;
};

export default async function FinishedWorkoutSummary({ lang, dict, accessToken, workoutId }: Props) {
  const [detail, exercisesResult, allSets] = await Promise.all([
    getWorkoutDetail(accessToken, workoutId),
    getExercises(accessToken),
    getAllSets(accessToken),
  ]);

  if (detail.error || !detail.workout?.finishedAt) return null;

  const prFlagsById = allSets.error ? new Map<string, PrFlags>() : computePrFlags(allSets.sets);
  const t = dict.workoutDetail;

  return (
    <WorkoutSummaryModal
      lang={lang}
      summary={buildWorkoutSummary(detail.workout, detail.sets, prFlagsById, exercisesResult.exerciseById)}
      dict={t.summary}
      kgUnit={dict.units.kg}
      unknownLabel={dict.common.unknown}
      prLabels={{ weight: t.prBadgeWeight, volume: t.prBadgeVolume }}
    />
  );
}
