import { useState, useEffect, useRef } from 'react';
import type { ImportPreview, ImportMode } from '../hooks/useDataTransfer';

interface ImportModalProps {
  preview: ImportPreview;
  onConfirm: (mode: ImportMode) => void;
  onCancel: () => void;
}

export default function ImportModal({ preview, onConfirm, onCancel }: ImportModalProps) {
  const [mode, setMode] = useState<ImportMode>('replace');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const firstRadio = panel.querySelector<HTMLInputElement>('input[type="radio"]');
    firstRadio?.focus();

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCancel();
        return;
      }

      if (e.key === 'Tab') {
        const focusable = panel!.querySelectorAll<HTMLElement>(
          'button, input, [tabindex]:not([tabindex="-1"])',
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div className="modal__overlay" onClick={onCancel}>
      <div
        className="modal__panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="import-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__header">
          <h2 id="import-modal-title">Gegevens importeren</h2>
          <button className="modal__close" onClick={onCancel} aria-label="Sluiten">
            &times;
          </button>
        </div>

        <div className="modal__body">
          <div className="import-preview">
            <div className="import-preview__stat">
              <span className="import-preview__stat-value">{preview.resultCount}</span>
              <span className="import-preview__stat-label">
                {preview.resultCount === 1 ? 'rekening' : 'rekeningen'}
              </span>
            </div>
            {preview.portfolioIdCount > 0 && (
              <div className="import-preview__stat">
                <span className="import-preview__stat-value">{preview.portfolioIdCount}</span>
                <span className="import-preview__stat-label">
                  {preview.portfolioIdCount === 1 ? 'portefeuille-item' : 'portefeuille-items'}
                </span>
              </div>
            )}
          </div>

          <fieldset className="import-mode">
            <legend className="import-mode__legend">Wat wil je doen?</legend>
            <label className={`import-mode__option${mode === 'replace' ? ' import-mode__option--active' : ''}`}>
              <input
                type="radio"
                name="import-mode"
                value="replace"
                checked={mode === 'replace'}
                onChange={() => setMode('replace')}
              />
              <div>
                <span className="import-mode__option-title">Vervangen</span>
                <span className="import-mode__option-desc">Bestaande gegevens worden gewist en vervangen door de import.</span>
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
                <span className="import-mode__option-title">Samenvoegen</span>
                <span className="import-mode__option-desc">Nieuwe rekeningen worden toegevoegd aan je bestaande gegevens.</span>
              </div>
            </label>
          </fieldset>
        </div>

        <div className="modal__footer">
          <button className="modal__btn modal__btn--cancel" onClick={onCancel}>
            Annuleren
          </button>
          <button className="modal__btn modal__btn--confirm" onClick={() => onConfirm(mode)}>
            Importeren
          </button>
        </div>
      </div>
    </div>
  );
}
