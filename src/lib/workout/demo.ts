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
    exerciseId: 'demo-overhead-press',
    code: 'overhead_press',
    category: 'compound',
    muscles: [
      { muscle: { code: 'shoulders' }, ratio: 0.75 },
      { muscle: { code: 'arms' }, ratio: 0.25 },
    ],
  },
  {
    exerciseId: 'demo-lateral-raise',
    code: 'lateral_raise',
    category: 'isolation',
    muscles: [{ muscle: { code: 'shoulders' }, ratio: 1 }],
  },
  {
    exerciseId: 'demo-face-pull',
    code: 'face_pull',
    category: 'isolation',
    muscles: [
      { muscle: { code: 'shoulders' }, ratio: 0.55 },
      { muscle: { code: 'back' }, ratio: 0.45 },
    ],
  },
  {
    exerciseId: 'demo-lat-pulldown',
    code: 'lat_pulldown',
    category: 'compound',
    muscles: [
      { muscle: { code: 'back' }, ratio: 0.7 },
      { muscle: { code: 'arms' }, ratio: 0.3 },
    ],
  },
  {
    exerciseId: 'demo-bent-over-row',
    code: 'bent_over_row',
    category: 'compound',
    muscles: [
      { muscle: { code: 'back' }, ratio: 0.65 },
      { muscle: { code: 'arms' }, ratio: 0.35 },
    ],
  },
  {
    exerciseId: 'demo-pull-up',
    code: 'pull_up',
    category: 'compound',
    muscles: [
      { muscle: { code: 'back' }, ratio: 0.6 },
      { muscle: { code: 'arms' }, ratio: 0.4 },
    ],
  },
  {
    exerciseId: 'demo-bench-press',
    code: 'bench_press',
    category: 'compound',
    muscles: [
      { muscle: { code: 'chest' }, ratio: 0.6 },
      { muscle: { code: 'shoulders' }, ratio: 0.25 },
      { muscle: { code: 'arms' }, ratio: 0.15 },
    ],
  },
  {
    exerciseId: 'demo-dumbbell-curl',
    code: 'dumbbell_curl',
    category: 'isolation',
    muscles: [{ muscle: { code: 'arms' }, ratio: 1 }],
  },
  {
    exerciseId: 'demo-tricep-pushdown',
    code: 'tricep_pushdown',
    category: 'isolation',
    muscles: [{ muscle: { code: 'arms' }, ratio: 1 }],
  },
  {
    exerciseId: 'demo-squat',
    code: 'squat',
    category: 'compound',
    muscles: [
      { muscle: { code: 'legs' }, ratio: 0.7 },
      { muscle: { code: 'core' }, ratio: 0.3 },
    ],
  },
  {
    exerciseId: 'demo-leg-press',
    code: 'leg_press',
    category: 'compound',
    muscles: [{ muscle: { code: 'legs' }, ratio: 1 }],
  },
  {
    exerciseId: 'demo-deadlift',
    code: 'deadlift',
    category: 'compound',
    muscles: [
      { muscle: { code: 'back' }, ratio: 0.5 },
      { muscle: { code: 'legs' }, ratio: 0.5 },
    ],
  },
];

const DEMO_EXERCISE_NAMES: Record<Locale, Record<string, string>> = {
  en: {
    'demo-overhead-press': 'Overhead Press',
    'demo-lateral-raise': 'Lateral Raise',
    'demo-face-pull': 'Face Pull',
    'demo-lat-pulldown': 'Lat Pulldown',
    'demo-bent-over-row': 'Bent-over Row',
    'demo-pull-up': 'Pull-up',
    'demo-bench-press': 'Bench Press',
    'demo-dumbbell-curl': 'Dumbbell Curl',
    'demo-tricep-pushdown': 'Tricep Pushdown',
    'demo-squat': 'Squat',
    'demo-leg-press': 'Leg Press',
    'demo-deadlift': 'Deadlift',
  },
  ja: {
    'demo-overhead-press': 'オーバーヘッドプレス',
    'demo-lateral-raise': 'サイドレイズ',
    'demo-face-pull': 'フェイスプル',
    'demo-lat-pulldown': 'ラットプルダウン',
    'demo-bent-over-row': 'ベントオーバーロウ',
    'demo-pull-up': '懸垂',
    'demo-bench-press': 'ベンチプレス',
    'demo-dumbbell-curl': 'ダンベルカール',
    'demo-tricep-pushdown': 'トライセプスプッシュダウン',
    'demo-squat': 'スクワット',
    'demo-leg-press': 'レッグプレス',
    'demo-deadlift': 'デッドリフト',
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
  'demo-overhead-press': 45,
  'demo-lateral-raise': 18,
  'demo-face-pull': 25,
  'demo-lat-pulldown': 55,
  'demo-bent-over-row': 60,
  'demo-pull-up': 70,
  'demo-bench-press': 60,
  'demo-dumbbell-curl': 15,
  'demo-tricep-pushdown': 25,
  'demo-squat': 40,
  'demo-leg-press': 45,
  'demo-deadlift': 50,
};

const PUSH_DAY = ['demo-overhead-press', 'demo-bench-press', 'demo-lateral-raise'];
const PULL_DAY = ['demo-lat-pulldown', 'demo-bent-over-row', 'demo-face-pull'];
const LEG_DAY = ['demo-squat', 'demo-leg-press', 'demo-deadlift'];

function rotationFor(daysAgo: number, index: number): string[] {
  if (daysAgo <= 7) {
    return index % 2 === 0 ? PUSH_DAY : PULL_DAY;
  }
  if (daysAgo <= 21) {
    return index % 3 === 0 ? LEG_DAY : index % 2 === 0 ? PUSH_DAY : PULL_DAY;
  }
  return index % 2 === 0 ? LEG_DAY : PULL_DAY;
}

function startOfDayAt(now: Date, daysAgo: number, hour: number): Date {
  const date = new Date(now);
  date.setHours(hour, 0, 0, 0);
  date.setDate(date.getDate() - daysAgo);
  return date;
}

function buildSets(workoutId: string, start: Date, exerciseIds: string[], progress: number): Set[] {
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
    const rotation = rotationFor(daysAgo, index);
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

  const activeStart = new Date(
    Math.max(now.getTime() - 45 * 60 * 1000, startOfDayAt(now, 0, 0).getTime()),
  );
  const activeId = 'demo-workout-active';
  entries.unshift({
    workout: { workoutId: activeId, startedAt: activeStart.toISOString() },
    sets: buildSets(activeId, activeStart, PUSH_DAY, FINISHED_DAY_OFFSETS.length + 1),
  });

  const workouts = entries.map(({ workout }) => workout);
  const sets = entries.flatMap(({ sets: workoutSets }) => workoutSets);

  return { workouts, entries, sets };
}
