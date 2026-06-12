import type { components as exerciseSchema } from '../../../gen/exercise/v1/exercise.schema';
import type { components as workoutSchema } from '../../../gen/workout/v1/workout.schema';

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

export const PROGRESSION_METRICS = ['maxWeight', 'volume'] as const;
export type ProgressionMetric = (typeof PROGRESSION_METRICS)[number];

export type ProgressionPoint = {
  workoutId: string;
  date: string;
  maxWeight: number;
  volume: number;
};

export type ExerciseProgression = {
  exerciseId: string;
  name: string;
  points: ProgressionPoint[];
};

export const MILESTONE_AXES = [
  'workoutCount',
  'totalSets',
  'totalVolume',
  'maxWeight',
  'streakDays',
] as const;
export type MilestoneAxis = (typeof MILESTONE_AXES)[number];

export const MILESTONE_THRESHOLDS: Record<MilestoneAxis, readonly number[]> = {
  workoutCount: [1, 10, 50, 100, 250],
  totalSets: [50, 250, 1000, 2500, 5000],
  totalVolume: [10000, 50000, 250000, 1000000, 5000000],
  maxWeight: [40, 60, 80, 100, 140],
  streakDays: [3, 5, 7, 14, 30],
};

export type MilestoneStats = Record<MilestoneAxis, number>;

export type MilestoneProgress = {
  axis: MilestoneAxis;
  threshold: number;
  unlocked: boolean;
  current: number;
  ratio: number;
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
        if (Date.parse(set.trainedAt) < sinceMs) continue;
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

export function buildExerciseProgressions(
  entries: { workout: Workout; sets: Set[] }[],
  exerciseById: Map<string, Exercise>,
): ExerciseProgression[] {
  const byExercise = new Map<string, ProgressionPoint[]>();

  for (const { workout, sets } of entries) {
    if (!workout.workoutId || !workout.startedAt) continue;

    const perExercise = new Map<string, { maxWeight: number; volume: number }>();
    for (const set of sets) {
      if (!set.exerciseId) continue;
      const weight = set.weight ?? 0;
      const rep = set.rep ?? 0;
      const current = perExercise.get(set.exerciseId) ?? { maxWeight: 0, volume: 0 };
      current.maxWeight = Math.max(current.maxWeight, weight);
      current.volume += rep * weight;
      perExercise.set(set.exerciseId, current);
    }

    for (const [exerciseId, { maxWeight, volume }] of perExercise) {
      if (maxWeight === 0 && volume === 0) continue;
      const points = byExercise.get(exerciseId) ?? [];
      points.push({ workoutId: workout.workoutId, date: workout.startedAt, maxWeight, volume });
      byExercise.set(exerciseId, points);
    }
  }

  const result: ExerciseProgression[] = [];
  for (const [exerciseId, points] of byExercise) {
    const exercise = exerciseById.get(exerciseId);
    if (!exercise?.name) continue;
    points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
    result.push({ exerciseId, name: exercise.name, points });
  }

  return result.sort((a, b) => a.name.localeCompare(b.name));
}

function nextDateKey(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year!, month! - 1, day!);
  date.setDate(date.getDate() + 1);
  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, '0');
  const nextDay = String(date.getDate()).padStart(2, '0');
  return `${nextYear}-${nextMonth}-${nextDay}`;
}

function previousDateKey(key: string): string {
  const [year, month, day] = key.split('-').map(Number);
  const date = new Date(year!, month! - 1, day!);
  date.setDate(date.getDate() - 1);
  const prevYear = date.getFullYear();
  const prevMonth = String(date.getMonth() + 1).padStart(2, '0');
  const prevDay = String(date.getDate()).padStart(2, '0');
  return `${prevYear}-${prevMonth}-${prevDay}`;
}

export function computeLongestStreak(workouts: Workout[]): number {
  const dateKeys = new Set<string>();
  for (const workout of workouts) {
    if (!workout.startedAt) continue;
    dateKeys.add(toLocalDateKey(workout.startedAt));
  }

  const sorted = [...dateKeys].sort();
  let longest = 0;
  let current = 0;
  let previous: string | null = null;
  for (const key of sorted) {
    current = previous !== null && nextDateKey(previous) === key ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = key;
  }
  return longest;
}

export function computeCurrentStreak(workouts: Workout[], now: Date = new Date()): number {
  const dateKeys = new Set<string>();
  for (const workout of workouts) {
    if (!workout.startedAt) continue;
    dateKeys.add(toLocalDateKey(workout.startedAt));
  }

  let anchor = toLocalDateKey(now.toISOString());
  if (!dateKeys.has(anchor)) anchor = previousDateKey(anchor);
  if (!dateKeys.has(anchor)) return 0;

  let streak = 0;
  let cursor = anchor;
  while (dateKeys.has(cursor)) {
    streak += 1;
    cursor = previousDateKey(cursor);
  }
  return streak;
}

export function countWorkoutsSince(
  workouts: Workout[],
  days: number,
  now: Date = new Date(),
): number {
  const sinceMs = now.getTime() - days * 24 * 60 * 60 * 1000;
  let count = 0;
  for (const workout of workouts) {
    if (!workout.startedAt) continue;
    if (Date.parse(workout.startedAt) < sinceMs) continue;
    count += 1;
  }
  return count;
}

export function buildMilestoneStats(entries: { workout: Workout; sets: Set[] }[]): MilestoneStats {
  let totalSets = 0;
  let totalVolume = 0;
  let maxWeight = 0;
  for (const { sets } of entries) {
    totalSets += sets.length;
    totalVolume += computeWorkoutVolume(sets);
    for (const set of sets) {
      maxWeight = Math.max(maxWeight, set.weight ?? 0);
    }
  }

  return {
    workoutCount: entries.length,
    totalSets,
    totalVolume,
    maxWeight,
    streakDays: computeLongestStreak(entries.map(({ workout }) => workout)),
  };
}

export function buildMilestoneProgress(stats: MilestoneStats): MilestoneProgress[] {
  return buildMilestoneProgressForAxes(stats, MILESTONE_AXES);
}

export function buildMilestoneProgressForAxes(
  stats: Partial<MilestoneStats>,
  axes: readonly MilestoneAxis[],
): MilestoneProgress[] {
  const result: MilestoneProgress[] = [];
  for (const axis of axes) {
    const current = stats[axis];
    if (current === undefined) continue;
    for (const threshold of MILESTONE_THRESHOLDS[axis]) {
      result.push({
        axis,
        threshold,
        unlocked: current >= threshold,
        current,
        ratio: Math.min(current / threshold, 1),
      });
    }
  }
  return result;
}

export function findNextMilestone(progress: MilestoneProgress[]): MilestoneProgress | null {
  let next: MilestoneProgress | null = null;
  for (const axis of MILESTONE_AXES) {
    const candidate = progress.find((entry) => entry.axis === axis && !entry.unlocked);
    if (!candidate) continue;
    if (next === null || candidate.ratio > next.ratio) next = candidate;
  }
  return next;
}
