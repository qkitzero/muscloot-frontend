import { client } from '@/app/api/auth/client';
import { SITE_URL } from '@/lib/env';
import { NextResponse } from 'next/server';

export async function GET() {
  const { data, error } = await client.POST('/v1/logout', {
    body: {
      returnTo: `${SITE_URL}/`,
    },
  });

  if (error || !data?.logoutUrl) {
    return NextResponse.json(error ?? { error: 'Missing logoutUrl' }, { status: 500 });
  }

  const res = NextResponse.redirect(data.logoutUrl);
  res.cookies.delete('access_token');
  return res;
}
