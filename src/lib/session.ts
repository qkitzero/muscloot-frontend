import 'server-only';

import { client as userClient } from '@/app/api/user/client';
import { cookies } from 'next/headers';
import { cache } from 'react';
import type { components } from '../../gen/user/v1/user.schema';

export type CurrentUser = components['schemas']['v1GetUserResponse'];

export const getAccessToken = cache(async (): Promise<string | null> => {
  const cookieStore = await cookies();
  return cookieStore.get('access_token')?.value ?? null;
});

export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const { data, error } = await userClient.GET('/v1/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (error || !data) return null;
  return data;
});
