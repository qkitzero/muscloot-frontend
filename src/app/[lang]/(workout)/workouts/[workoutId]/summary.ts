import type { components as exerciseSchema } from '../../../../../../gen/exercise/v1/exercise.schema';
import type { components as workoutSchema } from '../../../../../../gen/workout/v1/workout.schema';
import { computeWorkoutVolume } from '../stats/aggregate';
import type { PrFlags } from './records';

type Workout = workoutSchema['schemas']['v1Workout'];
type Set = workoutSchema['schemas']['v1Set'];
type Exercise = exerciseSchema['schemas']['v1Exercise'];

export type PrSummaryEntry = {
  name: string;
  weight: boolean;
  volume: boolean;
};

export type WorkoutSummary = {
  durationMs?: number;
  totalSets: number;
  totalVolume: number;
  prs: PrSummaryEntry[];
};

function parseTime(value?: string): number | undefined {
  if (!value) return undefined;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? undefined : time;
}

export function buildWorkoutSummary(
  workout: Workout,
  sets: Set[],
  prFlagsById: Map<string, PrFlags>,
  exerciseById: Map<string, Exercise>,
): WorkoutSummary {
  const started = parseTime(workout.startedAt);
  const finished = parseTime(workout.finishedAt);
  const durationMs =
    started !== undefined && finished !== undefined && finished >= started
      ? finished - started
      : undefined;

  const prByExercise = new Map<string, PrSummaryEntry>();
  for (const set of sets) {
    if (!set.setId || !set.exerciseId) continue;
    const flags = prFlagsById.get(set.setId);
    if (!flags) continue;
    const entry = prByExercise.get(set.exerciseId);
    if (entry) {
      entry.weight = entry.weight || flags.weight;
      entry.volume = entry.volume || flags.volume;
    } else {
      const exercise = exerciseById.get(set.exerciseId);
      prByExercise.set(set.exerciseId, {
        name: exercise?.name ?? exercise?.code ?? set.exerciseId,
        weight: flags.weight,
        volume: flags.volume,
      });
    }
  }

  return {
    durationMs,
    totalSets: sets.length,
    totalVolume: computeWorkoutVolume(sets),
    prs: [...prByExercise.values()],
  };
}

export function durationParts(ms: number): { hours: number; minutes: number } {
  const totalMinutes = Math.floor(ms / 60000);
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}
