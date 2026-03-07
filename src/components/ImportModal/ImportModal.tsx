import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { ImportPreview, ImportMode } from '../../hooks/useDataTransfer';
import Modal from '../Modal';
import './ImportModal.css';

interface ImportModalProps {
  preview: ImportPreview;
  onConfirm: (mode: ImportMode) => void;
  onCancel: () => void;
}

export default function ImportModal({ preview, onConfirm, onCancel }: ImportModalProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<ImportMode>('replace');

  return (
    <Modal
      titleId="import-modal-title"
      title={t('importModal.title')}
      onClose={onCancel}
      onConfirm={() => onConfirm(mode)}
      confirmLabel={t('importModal.confirm')}
    >
      <div className="import-preview">
        <div className="import-preview__stat">
          <span className="import-preview__stat-value">{preview.resultCount}</span>
          <span className="import-preview__stat-label">
            {t('importModal.account', { count: preview.resultCount })}
          </span>
        </div>
        {preview.portfolioIdCount > 0 && (
          <div className="import-preview__stat">
            <span className="import-preview__stat-value">{preview.portfolioIdCount}</span>
            <span className="import-preview__stat-label">
              {t('importModal.portfolioItem', { count: preview.portfolioIdCount })}
            </span>
          </div>
        )}
      </div>

      <fieldset className="import-mode">
        <legend className="import-mode__legend">{t('importModal.modeQuestion')}</legend>
        <label className={`import-mode__option${mode === 'replace' ? ' import-mode__option--active' : ''}`}>
          <input
            type="radio"
            name="import-mode"
            value="replace"
            checked={mode === 'replace'}
            onChange={() => setMode('replace')}
          />
          <div>
            <span className="import-mode__option-title">{t('importModal.replaceTitle')}</span>
            <span className="import-mode__option-desc">{t('importModal.replaceDesc')}</span>
          </div>
        </label>
        <label className={`import-mode__option${mode === 'merge' ? ' import-mode__option--active' : ''}`}>
          <input
            type="radio"
            name="import-mode"
            value="merge"
            checked={mode === 'merge'}
            onChange={() => setMode('merge')}
          />
          <div>
            <span className="import-mode__option-title">{t('importModal.mergeTitle')}</span>
            <span className="import-mode__option-desc">{t('importModal.mergeDesc')}</span>
          </div>
        </label>
      </fieldset>
    </Modal>
  );
}
