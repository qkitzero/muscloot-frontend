import { AUTH_SERVICE_URL } from '@/lib/env';
import createClient from 'openapi-fetch';
import type { paths } from '../../../../gen/auth/v1/auth.schema';

export const client = createClient<paths>({
  baseUrl: AUTH_SERVICE_URL,
});
