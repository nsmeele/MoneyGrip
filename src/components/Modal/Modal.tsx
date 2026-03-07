import { useRef } from 'react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import './Modal.css';

interface ModalProps {
  titleId: string;
  title: string;
  onClose: () => void;
  onConfirm: () => void;
  confirmLabel: string;
  cancelLabel?: string;
  children: ReactNode;
}

export default function Modal({ titleId, title, onClose, onConfirm, confirmLabel, cancelLabel, children }: ModalProps) {
  const { t } = useTranslation();
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, onClose);

  return (
    <div className="modal__overlay" onClick={onClose}>
      <div
        className="modal__panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 id={titleId}>{title}</h2>
          <button className="modal__close" onClick={onClose} aria-label={t('modal.close')}>
            <XMarkIcon aria-hidden="true" />
          </button>
        </div>

        <div className="modal__body">
          {children}
        </div>

        <div className="modal__footer">
          <button className="modal__btn modal__btn--cancel" onClick={onClose}>
            {cancelLabel ?? t('modal.cancel')}
          </button>
          <button className="modal__btn modal__btn--confirm" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
