import 'server-only';

import { client as exerciseClient } from '@/app/api/exercise/client';
import { fetchAllSets } from '@/app/api/set/list';
import { client as workoutClient } from '@/app/api/workout/client';
import { cache } from 'react';
import type { components as exerciseSchema } from '../../../gen/exercise/v1/exercise.schema';
import type { components as workoutSchema } from '../../../gen/workout/v1/workout.schema';

type Workout = workoutSchema['schemas']['v1Workout'];
type Set = workoutSchema['schemas']['v1Set'];
type Exercise = exerciseSchema['schemas']['v1Exercise'];

export const getWorkouts = cache(
  async (accessToken: string): Promise<{ workouts: Workout[]; error?: unknown }> => {
    const { data, error } = await workoutClient.GET('/v1/workouts', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (error) return { workouts: [], error };
    return { workouts: data?.workouts ?? [] };
  },
);

export const getExercises = cache(
  async (
    accessToken: string,
  ): Promise<{ exercises: Exercise[]; exerciseById: Map<string, Exercise>; error?: unknown }> => {
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
    accessToken: string,
    workoutId: string,
  ): Promise<{ workout?: Workout; sets: Set[]; error?: unknown }> => {
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
    accessToken: string,
  ): Promise<{ entries: { workout: Workout; sets: Set[] }[]; failures: number; error?: unknown }> => {
    const { workouts, error } = await getWorkouts(accessToken);
    if (error) return { entries: [], failures: 0, error };

    const details = await Promise.all(
      workouts
        .filter((workout): workout is Workout & { workoutId: string } => !!workout.workoutId)
        .map((workout) =>
          getWorkoutDetail(accessToken, workout.workoutId).then((detail) => ({ workout, detail })),
        ),
    );

    const entries = details.map(({ workout, detail }) => ({
      workout: detail.workout ?? workout,
      sets: detail.sets,
    }));
    const failures = details.filter(({ detail }) => !!detail.error).length;
    return { entries, failures };
  },
);

export const getAllSets = cache(async (accessToken: string) => fetchAllSets(accessToken));

export function findActiveWorkout(workouts: Workout[]): Workout | undefined {
  return workouts
    .filter((workout) => !!workout.workoutId && !workout.finishedAt)
    .sort((a, b) => (b.startedAt ?? '').localeCompare(a.startedAt ?? ''))[0];
}
