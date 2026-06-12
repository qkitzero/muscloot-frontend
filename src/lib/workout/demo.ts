import type { Locale } from '@/i18n/config';
import type { components as exerciseSchema } from '../../../gen/exercise/v1/exercise.schema';
import type { components as workoutSchema } from '../../../gen/workout/v1/workout.schema';

type Workout = workoutSchema['schemas']['v1Workout'];
type Set = workoutSchema['schemas']['v1Set'];
type Exercise = exerciseSchema['schemas']['v1Exercise'];

export type DemoData = {
  workouts: Workout[];
  entries: { workout: Workout; sets: Set[] }[];
  sets: Set[];
};

const DEMO_EXERCISES: (Exercise & { exerciseId: string })[] = [
  {
    exerciseId: 'demo-bench-press',
    code: 'bench_press',
    muscles: [{ code: 'chest' }, { code: 'arms' }],
  },
  {
    exerciseId: 'demo-squat',
    code: 'squat',
    muscles: [{ code: 'legs' }, { code: 'core' }],
  },
  {
    exerciseId: 'demo-deadlift',
    code: 'deadlift',
    muscles: [{ code: 'back' }, { code: 'legs' }],
  },
  {
    exerciseId: 'demo-overhead-press',
    code: 'overhead_press',
    muscles: [{ code: 'shoulders' }, { code: 'arms' }],
  },
];

const DEMO_EXERCISE_NAMES: Record<Locale, Record<string, string>> = {
  en: {
    'demo-bench-press': 'Bench Press',
    'demo-squat': 'Squat',
    'demo-deadlift': 'Deadlift',
    'demo-overhead-press': 'Overhead Press',
  },
  ja: {
    'demo-bench-press': 'ベンチプレス',
    'demo-squat': 'スクワット',
    'demo-deadlift': 'デッドリフト',
    'demo-overhead-press': 'オーバーヘッドプレス',
  },
};

export function buildDemoExercises(locale: Locale): (Exercise & { exerciseId: string })[] {
  return DEMO_EXERCISES.map((exercise) => ({
    ...exercise,
    name: DEMO_EXERCISE_NAMES[locale][exercise.exerciseId],
  }));
}

const FINISHED_DAY_OFFSETS = [1, 2, 4, 6, 8, 11, 13, 15, 18, 21, 25, 28, 32, 36];

const BASE_WEIGHTS: Record<string, number> = {
  'demo-bench-press': 50,
  'demo-squat': 70,
  'demo-deadlift': 90,
  'demo-overhead-press': 30,
};

function startOfDayAt(now: Date, daysAgo: number, hour: number): Date {
  const date = new Date(now);
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function buildSets(
  workoutId: string,
  start: Date,
  exerciseIds: string[],
  progress: number,
): Set[] {
  const sets: Set[] = [];
  exerciseIds.forEach((exerciseId, exerciseIndex) => {
    const weight = BASE_WEIGHTS[exerciseId]! + progress * 2.5;
    for (let i = 0; i < 3; i += 1) {
      const trainedAt = new Date(start.getTime() + (exerciseIndex * 3 + i) * 5 * 60 * 1000);
      sets.push({
        setId: `${workoutId}-set-${exerciseIndex}-${i}`,
        exerciseId,
        rep: 10 - i,
        weight,
        trainedAt: trainedAt.toISOString(),
        createdAt: trainedAt.toISOString(),
      });
    }
  });
  return sets;
}

export function buildDemoData(now: Date = new Date()): DemoData {
  const entries: { workout: Workout; sets: Set[] }[] = [];

  FINISHED_DAY_OFFSETS.forEach((daysAgo, index) => {
    const workoutId = `demo-workout-${daysAgo}`;
    const start = startOfDayAt(now, daysAgo, 18);
    const finish = new Date(start.getTime() + 65 * 60 * 1000);
    const rotation =
      index % 2 === 0
        ? ['demo-bench-press', 'demo-overhead-press']
        : ['demo-squat', 'demo-deadlift'];
    const progress = FINISHED_DAY_OFFSETS.length - index;
    entries.push({
      workout: {
        workoutId,
        startedAt: start.toISOString(),
        finishedAt: finish.toISOString(),
      },
      sets: buildSets(workoutId, start, rotation, progress),
    });
  });

  const activeStart = new Date(Math.max(now.getTime() - 45 * 60 * 1000, startOfDayAt(now, 0, 0).getTime()));
  const activeId = 'demo-workout-active';
  entries.unshift({
    workout: { workoutId: activeId, startedAt: activeStart.toISOString() },
    sets: buildSets(activeId, activeStart, ['demo-bench-press', 'demo-overhead-press'], FINISHED_DAY_OFFSETS.length + 1),
  });

  const workouts = entries.map(({ workout }) => workout);
  const sets = entries.flatMap(({ sets: workoutSets }) => workoutSets);

  return { workouts, entries, sets };
}
