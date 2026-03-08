import { useTranslation } from 'react-i18next';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { formatMonthLabel } from './formatMonthLabel';
import { LOCALE_MAP } from '../../i18n';
import type { SupportedLanguage } from '../../i18n';
import './MonthNav.css';

interface MonthNavProps {
  selectedMonthKey: string;
  isCurrentMonth: boolean;
  disablePrev?: boolean;
  disableNext?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onReset: () => void;
}

export default function MonthNav({
  selectedMonthKey,
  isCurrentMonth,
  disablePrev = false,
  disableNext = false,
  onPrev,
  onNext,
  onReset,
}: MonthNavProps) {
  const { t, i18n } = useTranslation();
  const locale = LOCALE_MAP[i18n.language as SupportedLanguage] ?? 'nl-NL';

  return (
    <div className="month-nav">
      <button
        className="month-nav__btn"
        onClick={onPrev}
        disabled={disablePrev}
        aria-label={t('monthNav.prevMonth')}
      >
        <ChevronLeftIcon aria-hidden="true" />
      </button>
      <div className="month-nav__label">
        <span className="month-nav__month">{formatMonthLabel(selectedMonthKey, locale)}</span>
        {isCurrentMonth
          ? <span className="month-nav__current">{t('monthNav.now')}</span>
          : <button className="btn-action month-nav__reset" onClick={onReset} aria-label={t('monthNav.backToCurrent')}>{t('monthNav.now')}</button>
        }
      </div>
      <button
        className="month-nav__btn"
        onClick={onNext}
        disabled={disableNext}
        aria-label={t('monthNav.nextMonth')}
      >
        <ChevronRightIcon aria-hidden="true" />
      </button>
    </div>
  );
}
