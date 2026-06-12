import { isLocale } from '@/i18n/config';
import { notFound, redirect } from 'next/navigation';

export default async function WorkoutStatsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  redirect(`/${lang}`);
}
