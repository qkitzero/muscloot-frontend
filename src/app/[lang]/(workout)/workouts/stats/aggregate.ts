import type { components as exerciseSchema } from '../../../../../../gen/exercise/v1/exercise.schema';
import type { components as workoutSchema } from '../../../../../../gen/workout/v1/workout.schema';

type Workout = workoutSchema['schemas']['v1Workout'];
type Set = workoutSchema['schemas']['v1Set'];
type Exercise = exerciseSchema['schemas']['v1Exercise'];

export const MUSCLE_CODES = ['chest', 'back', 'legs', 'shoulders', 'arms', 'core'] as const;
export type MuscleCode = (typeof MUSCLE_CODES)[number];

export type MuscleVolume = {
  code: MuscleCode;
  volume: number;
};

export const MUSCLE_BALANCE_PERIODS = ['week', 'month', 'all'] as const;
export type MuscleBalancePeriod = (typeof MUSCLE_BALANCE_PERIODS)[number];

const PERIOD_DAYS: Record<MuscleBalancePeriod, number | null> = {
  week: 7,
  month: 30,
  all: null,
};

export type MuscleBalanceByPeriod = Record<MuscleBalancePeriod, MuscleVolume[]>;

export type DailyCount = {
  date: string;
  count: number;
};

export type WorkoutVolume = {
  workoutId: string;
  startedAt: string;
  volume: number;
};

function toLocalDateKey(iso: string): string {
  const date = new Date(iso);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function buildDailyCounts(workouts: Workout[], weeks: number): DailyCount[] {
  const totalDays = weeks * 7;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const start = new Date(today);
  start.setDate(start.getDate() - (totalDays - 1));
  start.setDate(start.getDate() - start.getDay());

  const counts = new Map<string, number>();
  for (const workout of workouts) {
    if (!workout.startedAt) continue;
    const key = toLocalDateKey(workout.startedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  const result: DailyCount[] = [];
  const cursor = new Date(start);
  const end = new Date(today);
  while (cursor <= end) {
    const year = cursor.getFullYear();
    const month = String(cursor.getMonth() + 1).padStart(2, '0');
    const day = String(cursor.getDate()).padStart(2, '0');
    const key = `${year}-${month}-${day}`;
    result.push({ date: key, count: counts.get(key) ?? 0 });
    cursor.setDate(cursor.getDate() + 1);
  }
  return result;
}

export function computeWorkoutVolume(sets: Set[]): number {
  let volume = 0;
  for (const set of sets) {
    const rep = set.rep ?? 0;
    const weight = set.weight ?? 0;
    volume += rep * weight;
  }
  return volume;
}

function isMuscleCode(code: string): code is MuscleCode {
  return (MUSCLE_CODES as readonly string[]).includes(code);
}

export function buildMuscleBalance(
  entries: { workout: Workout; sets: Set[] }[],
  exerciseById: Map<string, Exercise>,
  since: Date | null = null,
): MuscleVolume[] {
  const totals = new Map<MuscleCode, number>(MUSCLE_CODES.map((code) => [code, 0]));
  const sinceMs = since?.getTime() ?? null;

  for (const { sets } of entries) {
    for (const set of sets) {
      if (!set.exerciseId) continue;
      if (sinceMs !== null) {
        if (!set.trainedAt) continue;
        if (new Date(set.trainedAt).getTime() < sinceMs) continue;
      }
      const exercise = exerciseById.get(set.exerciseId);
      if (!exercise?.muscles) continue;
      const volume = (set.rep ?? 0) * (set.weight ?? 0);
      if (volume === 0) continue;
      for (const muscle of exercise.muscles) {
        if (!muscle.code || !isMuscleCode(muscle.code)) continue;
        totals.set(muscle.code, (totals.get(muscle.code) ?? 0) + volume);
      }
    }
  }

  return MUSCLE_CODES.map((code) => ({ code, volume: totals.get(code) ?? 0 }));
}

export function buildMuscleBalanceByPeriod(
  entries: { workout: Workout; sets: Set[] }[],
  exerciseById: Map<string, Exercise>,
  now: Date,
): MuscleBalanceByPeriod {
  const result = {} as MuscleBalanceByPeriod;
  for (const period of MUSCLE_BALANCE_PERIODS) {
    const days = PERIOD_DAYS[period];
    const since = days === null ? null : new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    result[period] = buildMuscleBalance(entries, exerciseById, since);
  }
  return result;
}

export function buildWorkoutVolumes(entries: { workout: Workout; sets: Set[] }[]): WorkoutVolume[] {
  return entries
    .filter(({ workout }) => !!workout.workoutId && !!workout.startedAt)
    .map(({ workout, sets }) => ({
      workoutId: workout.workoutId!,
      startedAt: workout.startedAt!,
      volume: computeWorkoutVolume(sets),
    }))
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}
