import { Link } from 'react-router';
import { SUPPORTED_LANGUAGES } from '../../i18n/languages';
import { useLocale } from '../../context/useLocale';
import './LanguageSwitcher.css';

export default function LanguageSwitcher() {
  const { language } = useLocale();

  return (
    <nav className="language-switcher" aria-label="Language">
      {SUPPORTED_LANGUAGES.map(({ code, label }) => (
        <Link
          key={code}
          to={`/${code}`}
          className={`language-switcher__btn${language === code ? ' language-switcher__btn--active' : ''}`}
          aria-current={language === code ? 'page' : undefined}
          lang={code}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}
