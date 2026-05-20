import type { components as workoutSchema } from '../../../../../gen/workout/v1/workout.schema';

type Workout = workoutSchema['schemas']['v1Workout'];
type Set = workoutSchema['schemas']['v1Set'];

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
  // Align the start to the previous Sunday so the grid lays out cleanly.
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

export function buildWorkoutVolumes(
  entries: { workout: Workout; sets: Set[] }[],
): WorkoutVolume[] {
  return entries
    .filter(({ workout }) => !!workout.workoutId && !!workout.startedAt)
    .map(({ workout, sets }) => ({
      workoutId: workout.workoutId!,
      startedAt: workout.startedAt!,
      volume: computeWorkoutVolume(sets),
    }))
    .sort((a, b) => a.startedAt.localeCompare(b.startedAt));
}
