import { WORKOUT_SERVICE_URL } from '@/lib/env';
import createClient from 'openapi-fetch';
import type { paths } from '../../../../gen/set/v1/set.schema';

export const client = createClient<paths>({
  baseUrl: WORKOUT_SERVICE_URL,
});
