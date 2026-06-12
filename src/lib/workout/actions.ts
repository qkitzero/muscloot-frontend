'use server';

import { client as setClient } from '@/app/api/set/client';
import { fetchAllSets } from '@/app/api/set/list';
import { client as workoutClient } from '@/app/api/workout/client';
import { localePrefix } from '@/i18n/format';
import { getAccessToken } from '@/lib/session';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { computePrFlags, type PrFlags } from './records';

export type CreateSetErrorKey = 'notSignedIn' | 'createFailed';
export type CreateSetFieldErrorKey =
  | 'exerciseRequired'
  | 'repInvalid'
  | 'weightInvalid'
  | 'trainedAtInvalid';

export type CreateSetFormState = {
  errorKey?: CreateSetErrorKey;
  fieldErrorKeys?: {
    exerciseId?: CreateSetFieldErrorKey;
    rep?: CreateSetFieldErrorKey;
    weight?: CreateSetFieldErrorKey;
    trainedAt?: CreateSetFieldErrorKey;
  };
  pr?: PrFlags;
};

const TIMEZONE_SUFFIX = /(Z|[+-]\d{2}:?\d{2})$/i;

function parseTrainedAt(raw: string): string | null {
  if (!raw) return null;
  if (!TIMEZONE_SUFFIX.test(raw)) return null;
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function homePath(lang: string): string {
  return localePrefix(lang) || '/';
}

export async function startWorkout(lang: string) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    redirect('/api/auth/login');
  }

  const { error } = await workoutClient.POST('/v1/workouts/start', {
    headers: { Authorization: `Bearer ${accessToken}` },
    body: {},
  });

  const home = homePath(lang);
  if (error) {
    redirect(`${home}?error=start_failed`);
  }

  revalidatePath('/[lang]', 'page');
  redirect(home);
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

  const fieldErrorKeys: NonNullable<CreateSetFormState['fieldErrorKeys']> = {};
  if (!exerciseId) fieldErrorKeys.exerciseId = 'exerciseRequired';

  const rep = Number(repRaw);
  if (!repRaw || !Number.isInteger(rep) || rep <= 0) {
    fieldErrorKeys.rep = 'repInvalid';
  }

  const weight = Number(weightRaw);
  if (!weightRaw || !Number.isFinite(weight) || weight < 0) {
    fieldErrorKeys.weight = 'weightInvalid';
  }

  const trainedAt = parseTrainedAt(trainedAtRaw);
  if (!trainedAt) fieldErrorKeys.trainedAt = 'trainedAtInvalid';

  if (Object.keys(fieldErrorKeys).length > 0) {
    return { fieldErrorKeys };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { errorKey: 'notSignedIn' };
  }

  const { error, data } = await setClient.POST('/v1/sets', {
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
    return { errorKey: 'createFailed' };
  }

  const newSetId = data?.setId;
  let pr: PrFlags | undefined;
  if (newSetId) {
    const allSets = await fetchAllSets(accessToken);
    if (!allSets.error) {
      pr = computePrFlags(allSets.sets).get(newSetId);
    }
  }

  revalidatePath('/[lang]', 'page');
  revalidatePath('/[lang]/workouts/[workoutId]', 'page');
  return pr && (pr.weight || pr.volume) ? { pr } : {};
}

export async function finishWorkout(lang: string, workoutId: string, returnTo: 'home' | 'detail') {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    redirect('/api/auth/login');
  }

  const { error } = await workoutClient.POST('/v1/workouts/{workoutId}/finish', {
    params: { path: { workoutId } },
    headers: { Authorization: `Bearer ${accessToken}` },
    body: {},
  });

  const home = homePath(lang);
  const detail = `${localePrefix(lang)}/workouts/${workoutId}`;
  if (error) {
    redirect(returnTo === 'home' ? `${home}?error=finish_failed` : `${detail}?error=finish_failed`);
  }

  revalidatePath('/[lang]', 'page');
  revalidatePath('/[lang]/workouts/[workoutId]', 'page');
  redirect(returnTo === 'home' ? `${home}?finished=${workoutId}` : `${detail}?finished=1`);
}
