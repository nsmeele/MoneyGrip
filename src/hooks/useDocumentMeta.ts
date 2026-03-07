import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, LOCALE_MAP } from '../i18n/languages';
import type { SupportedLanguage } from '../i18n/languages';
import { CANONICAL_ORIGIN, BASE_PATH } from '../constants/app';

function upsertLink(rel: string, href: string, hreflang?: string) {
  const selector = hreflang
    ? `link[rel="${rel}"][hreflang="${hreflang}"]`
    : `link[rel="${rel}"]:not([hreflang])`;
  let link = document.querySelector<HTMLLinkElement>(selector);
  if (!link) {
    link = document.createElement('link');
    link.rel = rel;
    if (hreflang) link.hreflang = hreflang;
    document.head.appendChild(link);
  }
  link.href = href;
}

function upsertMeta(name: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = name;
    document.head.appendChild(meta);
  }
  meta.content = content;
}

function upsertMetaProperty(property: string, content: string) {
  let meta = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('property', property);
    document.head.appendChild(meta);
  }
  meta.content = content;
}

export function useDocumentMeta() {
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const lang = i18n.language as SupportedLanguage;
    const langUrl = (l: string) => `${CANONICAL_ORIGIN}${BASE_PATH}/${l}`;
    const currentUrl = langUrl(lang);

    document.title = t('meta.title');
    upsertMeta('description', t('meta.description'));
    upsertLink('canonical', currentUrl);

    for (const { code } of SUPPORTED_LANGUAGES) {
      upsertLink('alternate', langUrl(code), code);
    }
    upsertLink('alternate', langUrl('en'), 'x-default');

    upsertMetaProperty('og:title', t('meta.title'));
    upsertMetaProperty('og:description', t('meta.description'));
    upsertMetaProperty('og:url', currentUrl);
    upsertMetaProperty('og:locale', LOCALE_MAP[lang]);
    upsertMetaProperty('og:type', 'website');
    upsertMetaProperty('og:site_name', 'Interest-Calculator');
  }, [t, i18n.language]);
}
