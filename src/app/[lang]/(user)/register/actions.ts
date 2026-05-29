'use server';

import { client as userClient } from '@/app/api/user/client';
import { localePrefix } from '@/i18n/format';
import { getAccessToken } from '@/lib/session';
import { redirect } from 'next/navigation';

export type RegisterErrorKey = 'notSignedIn' | 'createFailed';
export type RegisterFieldErrorKey = 'displayNameRequired' | 'birthDateInvalid';

export type RegisterFormState = {
  errorKey?: RegisterErrorKey;
  fieldErrorKeys?: {
    displayName?: RegisterFieldErrorKey;
    birthDate?: RegisterFieldErrorKey;
  };
};

function parseBirthDate(raw: string): { year: number; month: number; day: number } | null {
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

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
  lang: string,
  _prev: RegisterFormState,
  formData: FormData,
): Promise<RegisterFormState> {
  const displayName = String(formData.get('displayName') ?? '').trim();
  const birthDateRaw = String(formData.get('birthDate') ?? '');

  const fieldErrorKeys: NonNullable<RegisterFormState['fieldErrorKeys']> = {};
  if (!displayName) fieldErrorKeys.displayName = 'displayNameRequired';

  const parsedDate = parseBirthDate(birthDateRaw);
  if (!parsedDate) fieldErrorKeys.birthDate = 'birthDateInvalid';

  if (Object.keys(fieldErrorKeys).length > 0) {
    return { fieldErrorKeys };
  }

  const accessToken = await getAccessToken();
  if (!accessToken) {
    return { errorKey: 'notSignedIn' };
  }

  const { error } = await userClient.POST('/v1/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
    body: {
      displayName,
      birthDate: parsedDate!,
    },
  });

  if (error) {
    return { errorKey: 'createFailed' };
  }

  redirect(localePrefix(lang) || '/');
}
