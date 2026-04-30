import { translations } from './translations';

export type Locale = keyof typeof translations;
export type TranslationKey = keyof typeof translations.en;

export const DEFAULT_LOCALE: Locale = 'en';

export const t = (
  key: TranslationKey,
  locale: Locale,
  params?: Record<string, string | number>
): string => {
  const template =
    translations[locale]?.[key] ?? translations[DEFAULT_LOCALE][key] ?? key;

  if (!params) {
    return template;
  }

  return template.replace(/\{(\w+)\}/g, (_, paramKey) => {
    const value = params[paramKey];
    return value === undefined || value === null ? '' : String(value);
  });
};
