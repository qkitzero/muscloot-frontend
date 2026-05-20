'use server';

import { client as setClient } from '@/app/api/set/client';
import { client as workoutClient } from '@/app/api/workout/client';
import { getAccessToken } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export type CreateSetFormState = {
  error?: string;
  fieldErrors?: {
    exerciseId?: string;
    rep?: string;
    weight?: string;
    trainedAt?: string;
  };
};

function parseTrainedAt(raw: string): string | null {
  if (!raw) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

export async function createSet(
  workoutId: string,
  _prev: CreateSetFormState,
  formData: FormData,
): Promise<CreateSetFormState> {
  const exerciseId = String(formData.get('exerciseId') ?? '').trim();
  const repRaw = String(formData.get('rep') ?? '').trim();
  const weightRaw = String(formData.get('weight') ?? '').trim();
  const trainedAtRaw = String(formData.get('trainedAt') ?? '').trim();

  const fieldErrors: NonNullable<CreateSetFormState['fieldErrors']> = {};
  if (!exerciseId) fieldErrors.exerciseId = 'Exercise is required.';

  const rep = Number(repRaw);
  if (!repRaw || !Number.isInteger(rep) || rep <= 0) {
    fieldErrors.rep = 'Reps must be a positive integer.';
  }

  const weight = Number(weightRaw);
  if (!weightRaw || !Number.isFinite(weight) || weight < 0) {
    fieldErrors.weight = 'Weight must be zero or a positive number.';
  }

  const trainedAt = parseTrainedAt(trainedAtRaw);
  if (!trainedAt) fieldErrors.trainedAt = 'A valid trained-at time is required.';

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { error: 'You must be signed in to record a set.' };
  }

  const { error } = await setClient.POST('/v1/sets', {
    headers: { Authorization: `Bearer ${accessToken}` },
    body: {
      workoutId,
      exerciseId,
      rep,
      weight,
      trainedAt: trainedAt!,
    },
  });

  if (error) {
    return { error: 'Failed to record set. Please try again.' };
  }

  revalidatePath(`/workouts/${workoutId}`);
  return {};
}

export async function finishWorkout(workoutId: string) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    redirect('/api/auth/login');
  }

  const { error } = await workoutClient.POST('/v1/workouts/{workoutId}/finish', {
    params: { path: { workoutId } },
    headers: { Authorization: `Bearer ${accessToken}` },
    body: {},
  });

  if (error) {
    redirect(`/workouts/${workoutId}?error=finish_failed`);
  }

  revalidatePath(`/workouts/${workoutId}`);
  revalidatePath('/workouts');
  redirect('/workouts');
}
