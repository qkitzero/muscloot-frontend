'use server';

import { client as workoutClient } from '@/app/api/workout/client';
import { getAccessToken } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function startWorkout() {
  const accessToken = await getAccessToken();
  if (!accessToken) {
    redirect('/api/auth/login');
  }

  const { data, error } = await workoutClient.POST('/v1/workouts/start', {
    headers: { Authorization: `Bearer ${accessToken}` },
    body: {},
  });

  if (error || !data?.workoutId) {
    redirect('/workouts?error=start_failed');
  }

  redirect(`/workouts/${data.workoutId}`);
}
