import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '../../i18n';
import './LanguageSwitcher.css';

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();

  function handleChange(lng: string) {
    i18n.changeLanguage(lng);
  }

  return (
    <div className="language-switcher" role="radiogroup" aria-label="Language">
      {SUPPORTED_LANGUAGES.map(({ code, label }) => (
        <button
          key={code}
          className={`language-switcher__btn${i18n.language === code ? ' language-switcher__btn--active' : ''}`}
          onClick={() => handleChange(code)}
          aria-pressed={i18n.language === code}
          lang={code}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
