import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/getDictionary';
import { notFound } from 'next/navigation';
import RegisterForm from './RegisterForm';

export default async function Register({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const dict = await getDictionary(lang);

  return (
    <main className="flex flex-1 flex-col bg-zinc-50 px-4 py-8 sm:px-6 sm:py-12 dark:bg-black">
      <RegisterForm lang={lang} dict={dict.register} />
    </main>
  );
}
