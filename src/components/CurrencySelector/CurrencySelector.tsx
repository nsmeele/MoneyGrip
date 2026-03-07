import { useTranslation } from 'react-i18next';
import { useCurrency } from '../../hooks/useCurrency';
import { SUPPORTED_CURRENCIES, Currency } from '../../enums/Currency';
import './CurrencySelector.css';

export default function CurrencySelector() {
  const { t } = useTranslation();
  const { currency, setCurrency } = useCurrency();

  return (
    <div className="currency-selector">
      <select
        className="currency-selector__select"
        value={currency}
        onChange={(e) => setCurrency(e.target.value as Currency)}
        aria-label={t('currency.ariaLabel')}
      >
        {SUPPORTED_CURRENCIES.map((code) => (
          <option key={code} value={code}>
            {code}
          </option>
        ))}
      </select>
    </div>
  );
}
