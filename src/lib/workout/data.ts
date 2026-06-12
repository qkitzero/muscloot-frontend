import 'server-only';

import { client as exerciseClient } from '@/app/api/exercise/client';
import { fetchAllSets } from '@/app/api/set/list';
import { client as workoutClient } from '@/app/api/workout/client';
import type { Locale } from '@/i18n/config';
import { cache } from 'react';
import type { components as exerciseSchema } from '../../../gen/exercise/v1/exercise.schema';
import type { components as workoutSchema } from '../../../gen/workout/v1/workout.schema';
import { buildDemoData, buildDemoExercises } from './demo';

type Workout = workoutSchema['schemas']['v1Workout'];
type Set = workoutSchema['schemas']['v1Set'];
type Exercise = exerciseSchema['schemas']['v1Exercise'];

const getDemoData = cache(() => buildDemoData());

export const getWorkouts = cache(
  async (accessToken: string | null): Promise<{ workouts: Workout[]; error?: unknown }> => {
    if (accessToken === null) return { workouts: getDemoData().workouts };
    const { data, error } = await workoutClient.GET('/v1/workouts', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (error) return { workouts: [], error };
    return { workouts: data?.workouts ?? [] };
  },
);

export const getExercises = cache(
  async (
    accessToken: string | null,
    lang: Locale,
  ): Promise<{ exercises: Exercise[]; exerciseById: Map<string, Exercise>; error?: unknown }> => {
    if (accessToken === null) {
      const exercises = buildDemoExercises(lang);
      const exerciseById = new Map<string, Exercise>(
        exercises.map((exercise) => [exercise.exerciseId, exercise]),
      );
      return { exercises, exerciseById };
    }
    const { data, error } = await exerciseClient.GET('/v1/exercises', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const exercises = data?.exercises ?? [];
    const exerciseById = new Map<string, Exercise>(
      exercises
        .filter((exercise): exercise is Exercise & { exerciseId: string } => !!exercise.exerciseId)
        .map((exercise) => [exercise.exerciseId, exercise]),
    );
    if (error) return { exercises, exerciseById, error };
    return { exercises, exerciseById };
  },
);

export const getWorkoutDetail = cache(
  async (
    accessToken: string | null,
    workoutId: string,
  ): Promise<{ workout?: Workout; sets: Set[]; error?: unknown }> => {
    if (accessToken === null) {
      const entry = getDemoData().entries.find(({ workout }) => workout.workoutId === workoutId);
      if (!entry) return { sets: [], error: new Error('not found') };
      return { workout: entry.workout, sets: entry.sets };
    }
    const { data, error } = await workoutClient.GET('/v1/workouts/{workoutId}', {
      params: { path: { workoutId } },
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (error || !data?.workout) return { sets: [], error: error ?? new Error('not found') };
    return { workout: data.workout, sets: data.sets ?? [] };
  },
);

export const getWorkoutEntries = cache(
  async (
    accessToken: string | null,
  ): Promise<{ entries: { workout: Workout; sets: Set[] }[]; failures: number; error?: unknown }> => {
    if (accessToken === null) return { entries: getDemoData().entries, failures: 0 };
    const [{ workouts, error }, allSets] = await Promise.all([
      getWorkouts(accessToken),
      getAllSets(accessToken),
    ]);
    if (error) return { entries: [], failures: 0, error };

    const setsByWorkoutId = new Map<string, Set[]>();
    if (!allSets.error) {
      for (const set of allSets.sets) {
        if (!set.workoutId) continue;
        const bucket = setsByWorkoutId.get(set.workoutId);
        if (bucket) bucket.push(set);
        else setsByWorkoutId.set(set.workoutId, [set]);
      }
    }

    const entries = workouts
      .filter((workout): workout is Workout & { workoutId: string } => !!workout.workoutId)
      .map((workout) => ({ workout, sets: setsByWorkoutId.get(workout.workoutId) ?? [] }));
    return { entries, failures: allSets.error ? 1 : 0 };
  },
);

export const getAllSets = cache(
  async (accessToken: string | null): Promise<{ sets: Set[]; error?: unknown }> => {
    if (accessToken === null) return { sets: getDemoData().sets };
    return fetchAllSets(accessToken);
  },
);

export function findActiveWorkout(workouts: Workout[]): Workout | undefined {
  return workouts
    .filter((workout) => !!workout.workoutId && !workout.finishedAt)
    .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))[0];
}
