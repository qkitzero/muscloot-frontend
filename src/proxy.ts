import { NextResponse, type NextRequest } from 'next/server';
import { defaultLocale, locales, type Locale } from '@/i18n/config';

const LOCALE_COOKIE = 'NEXT_LOCALE';

function negotiateLocale(request: NextRequest): Locale {
  const cookie = request.cookies.get(LOCALE_COOKIE)?.value;
  if (cookie && (locales as readonly string[]).includes(cookie)) {
    return cookie as Locale;
  }

  const header = request.headers.get('accept-language');
  if (header) {
    const candidates = header
      .split(',')
      .map((part) => {
        const [tag, qPart] = part.trim().split(';q=');
        const q = qPart ? Number(qPart) : 1;
        return { tag: tag?.toLowerCase() ?? '', q: Number.isFinite(q) ? q : 0 };
      })
      .filter((c) => c.tag)
      .sort((a, b) => b.q - a.q);

    for (const { tag } of candidates) {
      const base = tag.split('-')[0]!;
      const match = locales.find((l) => l === base);
      if (match) return match;
    }
  }

  return defaultLocale;
}

export function proxy(request: NextRequest): NextResponse | undefined {
  const { pathname, search } = request.nextUrl;

  const hasLocale = locales.some(
    (locale) => pathname === `/${locale}` || pathname.startsWith(`/${locale}/`),
  );
  if (hasLocale) return;

  const locale = negotiateLocale(request);
  const url = request.nextUrl.clone();
  url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
  url.search = search;
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|exercises/).*)'],
};
