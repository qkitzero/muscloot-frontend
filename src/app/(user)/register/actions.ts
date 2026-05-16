'use server';

import { client as userClient } from '@/app/api/user/client';
import { getAccessToken } from '@/lib/session';
import { redirect } from 'next/navigation';

export type RegisterFormState = {
  error?: string;
  fieldErrors?: {
    displayName?: string;
    birthDate?: string;
  };
};

export async function registerUser(
  _prev: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const displayName = String(formData.get('displayName') ?? '').trim();
  const birthDateRaw = String(formData.get('birthDate') ?? '');

  const fieldErrors: NonNullable<RegisterFormState['fieldErrors']> = {};
  if (!displayName) fieldErrors.displayName = 'Display name is required.';

  const match = birthDateRaw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) fieldErrors.birthDate = 'Birth date is required.';

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { error: 'You must be signed in to register.' };
  }

  const [, year, month, day] = match!;
  const { error } = await userClient.POST('/v1/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
    body: {
      displayName,
      birthDate: {
        year: Number(year),
        month: Number(month),
        day: Number(day),
      },
    },
  });

  if (error) {
    return { error: 'Failed to create user. Please try again.' };
  }

  redirect('/');
}
