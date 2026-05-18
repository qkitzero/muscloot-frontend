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

function parseBirthDate(raw: string): { year: number; month: number; day: number } | null {
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  // Reject rollovers such as 2024-02-31 → Mar 2 by checking the UTC fields
  // round-trip to the same y/m/d.
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export async function registerUser(
  _prev: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const displayName = String(formData.get('displayName') ?? '').trim();
  const birthDateRaw = String(formData.get('birthDate') ?? '');

  const fieldErrors: NonNullable<RegisterFormState['fieldErrors']> = {};
  if (!displayName) fieldErrors.displayName = 'Display name is required.';

  const parsedDate = parseBirthDate(birthDateRaw);
  if (!parsedDate) fieldErrors.birthDate = 'A valid birth date is required.';

  if (Object.keys(fieldErrors).length > 0) {
    return { fieldErrors };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { error: 'You must be signed in to register.' };
  }

  const { error } = await userClient.POST('/v1/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
    body: {
      displayName,
      birthDate: parsedDate!,
    },
  });

  if (error) {
    return { error: 'Failed to create user. Please try again.' };
  }

  redirect('/');
}
