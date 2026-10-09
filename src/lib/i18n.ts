import en from '../../messages/en.json';
import ur from '../../messages/ur.json';

export type Language = 'en' | 'ur';
export type TranslationKey = keyof typeof en;

const translations = {
  en,
  ur,
};

export function getTranslation(lang: Language, key: string): string {
  const keys = key.split('.');
  let value: any = translations[lang];

  for (const k of keys) {
    value = value?.[k];
  }

  return value || key;
}

export function getDirection(lang: Language): 'ltr' | 'rtl' {
  return lang === 'ur' ? 'rtl' : 'ltr';
}
