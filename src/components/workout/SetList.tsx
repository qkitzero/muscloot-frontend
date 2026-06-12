import ExerciseImage from '@/components/ExerciseImage';
import FormattedDateTime from '@/components/FormattedDateTime';
import type { Locale } from '@/i18n/config';
import { translate } from '@/i18n/format';
import type { Dictionary } from '@/i18n/getDictionary';
import type { PrFlags } from '@/lib/workout/records';
import type { components as exerciseSchema } from '../../../gen/exercise/v1/exercise.schema';
import type { components as workoutSchema } from '../../../gen/workout/v1/workout.schema';

type Set = workoutSchema['schemas']['v1Set'];
type Exercise = exerciseSchema['schemas']['v1Exercise'];

type Props = {
  sets: Set[];
  exerciseById: Map<string, Exercise>;
  prFlagsById: Map<string, PrFlags>;
  lang: Locale;
  dict: Dictionary['workoutDetail'];
  kgUnit: string;
};

function exerciseFor(set: Set, byId: Map<string, Exercise>): Exercise | undefined {
  if (!set.exerciseId) return undefined;
  return byId.get(set.exerciseId);
}

function exerciseLabel(set: Set, byId: Map<string, Exercise>, unknownLabel: string): string {
  if (!set.exerciseId) return unknownLabel;
  const exercise = byId.get(set.exerciseId);
  return exercise?.name ?? exercise?.code ?? set.exerciseId;
}

export default function SetList({ sets, exerciseById, prFlagsById, lang, dict, kgUnit }: Props) {
  if (sets.length === 0) {
    return <p className="text-sm text-zinc-600 dark:text-zinc-400">{dict.setsEmpty}</p>;
  }

  return (
    <ul className="flex flex-col divide-y divide-black/[.06] dark:divide-white/[.08]">
      {sets.map((set) => {
        const exercise = exerciseFor(set, exerciseById);
        const label = exerciseLabel(set, exerciseById, dict.unknownExercise);
        const prFlags = set.setId ? prFlagsById.get(set.setId) : undefined;
        return (
          <li key={set.setId} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
            <ExerciseImage
              code={exercise?.code}
              name={label}
              className="h-10 w-10 shrink-0 sm:h-12 sm:w-12"
            />
            <span className="min-w-0 flex-1 text-zinc-900 dark:text-zinc-50">{label}</span>
            <span className="text-zinc-600 dark:text-zinc-400">
              {translate(lang, dict.setSummary, {
                rep: set.rep ?? 0,
                weight: set.weight ?? 0,
                unit: kgUnit,
              })}
            </span>
            {prFlags && (
              <span className="flex shrink-0 items-center gap-0.5 leading-none">
                {prFlags.weight && (
                  <span
                    role="img"
                    aria-label={dict.prBadgeWeight}
                    title={dict.prBadgeWeight}
                    className="text-base"
                  >
                    👑
                  </span>
                )}
                {prFlags.volume && (
                  <span
                    role="img"
                    aria-label={dict.prBadgeVolume}
                    title={dict.prBadgeVolume}
                    className="text-base"
                  >
                    💪
                  </span>
                )}
              </span>
            )}
            <span className="w-full text-xs text-zinc-500 sm:w-auto sm:text-right dark:text-zinc-500">
              <FormattedDateTime value={set.trainedAt} lang={lang} />
            </span>
          </li>
        );
      })}
    </ul>
  );
}
