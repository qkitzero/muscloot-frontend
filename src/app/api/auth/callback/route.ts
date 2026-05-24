import { client as authClient } from '@/app/api/auth/client';
import { client as userClient } from '@/app/api/user/client';
import { IS_PRODUCTION, SITE_URL } from '@/lib/env';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  if (!code) {
    return NextResponse.json({ error: 'Missing code' }, { status: 400 });
  }

  const { data: authData, error: authError } = await authClient.POST('/v1/exchange-code', {
    body: { code, redirectUri: `${SITE_URL}/api/auth/callback` },
  });

  if (authError) {
    console.error('auth-service /v1/exchange-code failed', authError);
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 });
  }

  const accessToken = authData.accessToken;
  if (!accessToken) {
    return NextResponse.json({ error: 'Missing access token' }, { status: 500 });
  }

  const { error: userError, response: userResponse } = await userClient.GET('/v1/user', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  const isNewUser = userResponse.status === 404;
  if (!isNewUser && userError) {
    console.error('user-service /v1/user failed', userError);
    return NextResponse.json({ error: 'Failed to retrieve user information' }, { status: 500 });
  }

  const res = NextResponse.redirect(`${SITE_URL}${isNewUser ? '/register' : '/'}`);
  res.cookies.set('access_token', accessToken, {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    path: '/',
  });
  return res;
}
