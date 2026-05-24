import type { Locale } from './config';

const intlLocale: Record<Locale, string> = {
  en: 'en-US',
  ja: 'ja-JP',
};

export function toIntlLocale(locale: Locale): string {
  return intlLocale[locale];
}

export function formatDateTime(
  locale: Locale,
  value: string | number | Date | undefined,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' },
): string | undefined {
  if (value === undefined || value === '') return undefined;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return new Intl.DateTimeFormat(toIntlLocale(locale), options).format(date);
}

export function formatNumber(
  locale: Locale,
  value: number,
  options?: Intl.NumberFormatOptions,
): string {
  return new Intl.NumberFormat(toIntlLocale(locale), options).format(value);
}

type InterpolationValue = string | number;

export function interpolate(
  template: string,
  values: Record<string, InterpolationValue>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in values ? String(values[key]) : `{${key}}`,
  );
}

type PluralCategory = Intl.LDMLPluralRule;

export function selectPlural(
  locale: Locale,
  template: string,
  values: Record<string, InterpolationValue>,
): string {
  return template.replace(
    /\{(\w+),\s*plural,\s*([^}]+)\}/g,
    (_, key: string, body: string) => {
      const raw = values[key];
      const count = typeof raw === 'number' ? raw : Number(raw);
      if (!Number.isFinite(count)) return '';
      const cases = parsePluralCases(body);
      const exact = cases.get(`=${count}`);
      if (exact !== undefined) return exact.replace(/#/g, String(count));
      const category = new Intl.PluralRules(toIntlLocale(locale)).select(count) as PluralCategory;
      const chosen = cases.get(category) ?? cases.get('other') ?? '';
      return chosen.replace(/#/g, String(count));
    },
  );
}

function parsePluralCases(body: string): Map<string, string> {
  const cases = new Map<string, string>();
  let i = 0;
  while (i < body.length) {
    while (i < body.length && /\s/.test(body[i]!)) i++;
    let key = '';
    while (i < body.length && !/\s/.test(body[i]!) && body[i] !== '{') {
      key += body[i++];
    }
    while (i < body.length && body[i] !== '{') i++;
    if (body[i] !== '{') break;
    i++;
    let depth = 1;
    let value = '';
    while (i < body.length && depth > 0) {
      const ch = body[i]!;
      if (ch === '{') depth++;
      else if (ch === '}') {
        depth--;
        if (depth === 0) break;
      }
      value += ch;
      i++;
    }
    i++;
    if (key) cases.set(key, value);
  }
  return cases;
}

export function translate(
  locale: Locale,
  template: string,
  values: Record<string, InterpolationValue> = {},
): string {
  const pluralized = selectPlural(locale, template, values);
  return interpolate(pluralized, values);
}
