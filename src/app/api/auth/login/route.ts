import { client } from '@/app/api/auth/client';
import { SITE_URL } from '@/lib/env';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data, error } = await client.POST('/v1/login', {
    body: {
      redirectUri: `${SITE_URL}/api/auth/callback`,
    },
  });

  if (error || !data?.loginUrl) {
    return NextResponse.json(error ?? { error: 'Missing loginUrl' }, { status: 500 });
  }

  return NextResponse.redirect(data.loginUrl);
}
