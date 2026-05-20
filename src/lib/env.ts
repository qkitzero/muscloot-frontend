export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
export const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:8081';
export const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:8082';
export const WORKOUT_SERVICE_URL = process.env.WORKOUT_SERVICE_URL || 'http://localhost:8083';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production';
