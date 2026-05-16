import { USER_SERVICE_URL } from '@/lib/env';
import createClient from 'openapi-fetch';
import type { paths } from '../../../../gen/user/v1/user.schema';

export const client = createClient<paths>({
  baseUrl: USER_SERVICE_URL,
});
