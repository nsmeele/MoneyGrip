import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import AccountForm from '../AccountForm';
import type { BankAccount } from '../../models/BankAccount';
import './AccountFormModal.css';

interface AccountFormModalProps {
  editingResult: BankAccount | null;
  onResult: (result: BankAccount) => void;
  onClose: () => void;
}

export default function AccountFormModal({ editingResult, onResult, onClose }: AccountFormModalProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, onClose);

  return (
    <div className="modal__overlay" onClick={onClose}>
      <div
        className="modal__panel modal__panel--form"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="account-form-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 id="account-form-modal-title">
            {editingResult ? t('form.editTitle') : t('form.newTitle')}
          </h2>
          <button className="modal__close" onClick={onClose} aria-label={t('modal.close')}>
            <XMarkIcon aria-hidden="true" />
          </button>
        </div>

        <div className="account-form-modal__body">
          <AccountForm
            onResult={onResult}
            editingResult={editingResult}
            onCancelEdit={onClose}
          />
        </div>
      </div>
    </div>
  );
}
