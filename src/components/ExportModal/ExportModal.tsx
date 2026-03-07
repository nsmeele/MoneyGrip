import { useTranslation } from 'react-i18next';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import Modal from '../Modal';
import './ExportModal.css';

interface ExportModalProps {
  resultCount: number;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ExportModal({ resultCount, onConfirm, onCancel }: ExportModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      titleId="export-modal-title"
      title={t('exportModal.title')}
      onClose={onCancel}
      onConfirm={onConfirm}
      confirmLabel={t('exportModal.confirm')}
    >
      <p className="export-modal__count">
        {t('exportModal.count', { count: resultCount })}
      </p>
      <p className="export-modal__warning">
        <ExclamationTriangleIcon className="export-modal__warning-icon" aria-hidden="true" />
        {t('exportModal.warning')}
      </p>
      <p className="export-modal__hint">
        {t('exportModal.cloudHint')}
      </p>
    </Modal>
  );
}
