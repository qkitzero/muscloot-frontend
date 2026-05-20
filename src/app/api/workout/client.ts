import { WORKOUT_SERVICE_URL } from '@/lib/env';
import createClient from 'openapi-fetch';
import type { paths } from '../../../../gen/workout/v1/workout.schema';

export const client = createClient<paths>({
  baseUrl: WORKOUT_SERVICE_URL,
});
