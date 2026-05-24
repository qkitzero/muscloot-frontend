'use server';

import { client as workoutClient } from '@/app/api/workout/client';
import { isLocale } from '@/i18n/config';
import { getAccessToken } from '@/lib/session';
import { redirect } from 'next/navigation';

function localePrefix(lang: string): string {
  return isLocale(lang) ? `/${lang}` : '';
}

export async function startWorkout(lang: string) {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    redirect('/api/auth/login');
  }

  const { data, error } = await workoutClient.POST('/v1/workouts/start', {
    headers: { Authorization: `Bearer ${accessToken}` },
    body: {},
  });

  const prefix = localePrefix(lang);
  if (error || !data?.workoutId) {
    redirect(`${prefix}/workouts?error=start_failed`);
  }

  redirect(`${prefix}/workouts/${data.workoutId}`);
}
