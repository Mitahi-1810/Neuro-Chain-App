import { useMemo } from 'react';
import { useUIStore } from '../store/store';
import { t as translate, TranslationKey } from './index';

export const useI18n = () => {
  const { locale } = useUIStore();

  const t = useMemo(
    () =>
      (key: TranslationKey, params?: Record<string, string | number>) =>
        translate(key, locale, params),
    [locale]
  );

  return { t, locale };
};
