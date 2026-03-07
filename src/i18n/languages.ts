export const SUPPORTED_LANGUAGES = [
  { code: 'nl', label: 'NL' },
  { code: 'en', label: 'EN' },
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number]['code'];

export const LOCALE_MAP: Record<SupportedLanguage, string> = {
  nl: 'nl-NL',
  en: 'en-US',
};
