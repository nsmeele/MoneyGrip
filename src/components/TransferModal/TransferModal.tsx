import { useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useAccountStore } from '../../context/useAccountStore';
import { useTransfer } from '../../context/useTransfer';
import { useLocale } from '../../context/useLocale';
import { calculateTransferDates } from '../../utils/transferDates';
import { formatCurrency, formatDate, parseAmountInput, formatAmountInput } from '../../utils/format';
import { todayISO } from '../../utils/date';
import { CURRENCY_SYMBOLS, type Currency } from '../../enums/Currency';
import type { BankAccount } from '../../models/BankAccount';
import type { MoneyTransfer } from '../../models/MoneyTransfer';
import './TransferModal.css';

interface TransferModalProps {
  sourceAccount: BankAccount;
  onClose: () => void;
  getProjectedBalance?: (date: string) => number;
  editingTransfer?: MoneyTransfer;
}

interface TransferFormState {
  targetAccountId: string;
  amount: string;
  initiationDate: string;
  description: string;
  errors: Record<string, string>;
}

export default function TransferModal({ sourceAccount, onClose, getProjectedBalance, editingTransfer }: TransferModalProps) {
  const { t } = useTranslation();
  const { results } = useAccountStore();
  const { createTransfer, updateTransfer } = useTransfer();
  const { currency: globalCurrency } = useLocale();
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, onClose);

  const cur = (sourceAccount.currency as Currency) || globalCurrency;

  const otherAccounts = useMemo(
    () => results.filter((r) => r.id !== sourceAccount.id && r.hasCashFlows),
    [results, sourceAccount.id],
  );

  const [form, setForm] = useState<TransferFormState>(() => {
    if (editingTransfer) {
      return {
        targetAccountId: editingTransfer.targetAccountId,
        amount: formatAmountInput(editingTransfer.amount, cur),
        initiationDate: editingTransfer.initiationDate,
        description: editingTransfer.description,
        errors: {},
      };
    }
    return {
      targetAccountId: '',
      amount: '',
      initiationDate: todayISO(),
      description: t('transfer.descriptionDefault'),
      errors: {},
    };
  });

  function updateForm(patch: Partial<TransferFormState>) {
    setForm((prev) => ({ ...prev, ...patch }));
  }

  function clearError(key: string) {
    setForm((prev) => {
      const { [key]: _, ...rest } = prev.errors;
      return { ...prev, errors: rest };
    });
  }

  const targetAccount = results.find((r) => r.id === form.targetAccountId);

  const transferDates = useMemo(() => {
    if (!form.initiationDate) return null;
    return calculateTransferDates({
      initiationDate: form.initiationDate,
      sourceNoticePeriodValue: sourceAccount.noticePeriodValue,
      sourceNoticePeriodUnit: sourceAccount.noticePeriodUnit,
      sourceProcessingDays: sourceAccount.processingDays,
      targetProcessingDays: targetAccount?.processingDays,
    });
  }, [form.initiationDate, sourceAccount, targetAccount]);

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!form.targetAccountId) {
      errors.targetAccountId = t('transfer.errorTargetRequired');
    }

    const amount = parseAmountInput(form.amount, cur);
    if (!form.amount.trim() || isNaN(amount)) {
      errors.amount = t('transfer.errorAmountRequired');
    } else if (amount <= 0) {
      errors.amount = t('transfer.errorAmountPositive');
    } else if (getProjectedBalance && transferDates) {
      const available = getProjectedBalance(transferDates.withdrawalDate);
      if (amount > available) {
        errors.amount = t('transfer.errorExceedsBalance');
      }
    }

    if (!form.initiationDate) {
      errors.initiationDate = t('transfer.errorDateRequired');
    }

    return errors;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const validationErrors = validate();
    updateForm({ errors: validationErrors });
    if (Object.keys(validationErrors).length > 0) return;

    const amount = parseAmountInput(form.amount, cur);

    const params = {
      sourceAccountId: sourceAccount.id,
      targetAccountId: form.targetAccountId,
      amount,
      initiationDate: form.initiationDate,
      description: form.description || t('transfer.descriptionDefault'),
    };

    if (editingTransfer) {
      updateTransfer(editingTransfer.id, params);
    } else {
      createTransfer(params);
    }

    onClose();
  }

  return (
    <div className="modal__overlay" onClick={onClose}>
      <div
        className="modal__panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transfer-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 id="transfer-modal-title">{editingTransfer ? t('transfer.editTitle') : t('transfer.title')}</h2>
          <button className="modal__close" onClick={onClose} aria-label={t('modal.close')}>
            <XMarkIcon aria-hidden="true" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal__body">
            {otherAccounts.length === 0 ? (
              <p className="transfer-modal__empty">{t('transfer.noOtherAccounts')}</p>
            ) : (
              <>
                <div className="form-group">
                  <label className="form-label" htmlFor="targetAccountId">
                    {t('transfer.targetAccount')}
                  </label>
                  <select
                    id="targetAccountId"
                    className={`form-input${form.errors.targetAccountId ? ' form-input--error' : ''}`}
                    value={form.targetAccountId}
                    onChange={(e) => { updateForm({ targetAccountId: e.target.value }); clearError('targetAccountId'); }}
                  >
                    <option value="">{t('transfer.selectAccount')}</option>
                    {otherAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {formatCurrency(acc.currentBalance, (acc.currency as Currency) || globalCurrency)} — {acc.annualInterestRate}%
                      </option>
                    ))}
                  </select>
                  {form.errors.targetAccountId && <span className="form-error">{form.errors.targetAccountId}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="transferAmount">
                    {t('transfer.amount')}
                  </label>
                  <div className="form-input-prefix">
                    <span className="prefix">{CURRENCY_SYMBOLS[cur]}</span>
                    <input
                      id="transferAmount"
                      type="text"
                      inputMode="decimal"
                      className={`form-input${form.errors.amount ? ' form-input--error' : ''}`}
                      value={form.amount}
                      onChange={(e) => { updateForm({ amount: e.target.value }); clearError('amount'); }}
                      onBlur={() => {
                        const parsed = parseAmountInput(form.amount, cur);
                        if (!isNaN(parsed) && parsed > 0) {
                          updateForm({ amount: formatAmountInput(form.amount, cur) });
                        }
                      }}
                      placeholder="1.000"
                    />
                  </div>
                  {form.errors.amount && <span className="form-error">{form.errors.amount}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="transferDate">
                    {t('transfer.initiationDate')}
                  </label>
                  <input
                    id="transferDate"
                    type="date"
                    className={`form-input${form.errors.initiationDate ? ' form-input--error' : ''}`}
                    value={form.initiationDate}
                    onChange={(e) => { updateForm({ initiationDate: e.target.value }); clearError('initiationDate'); }}
                  />
                  {form.errors.initiationDate && <span className="form-error">{form.errors.initiationDate}</span>}
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="transferDescription">
                    {t('transfer.description')}
                  </label>
                  <input
                    id="transferDescription"
                    type="text"
                    className="form-input"
                    value={form.description}
                    onChange={(e) => updateForm({ description: e.target.value })}
                  />
                </div>

                {transferDates && (
                  <div className="transfer-modal__dates">
                    <div className="transfer-modal__date-row">
                      <span className="transfer-modal__date-label">{t('transfer.withdrawalDate')}</span>
                      <span className="transfer-modal__date-value">{formatDate(transferDates.withdrawalDate)}</span>
                    </div>
                    <div className="transfer-modal__date-row">
                      <span className="transfer-modal__date-label">{t('transfer.depositDate')}</span>
                      <span className="transfer-modal__date-value">{formatDate(transferDates.depositDate)}</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          <div className="modal__footer">
            <button type="button" className="modal__btn modal__btn--cancel" onClick={onClose}>
              {t('transfer.cancel')}
            </button>
            {otherAccounts.length > 0 && (
              <button type="submit" className="modal__btn modal__btn--confirm">
                {editingTransfer ? t('transfer.save') : t('transfer.submit')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
