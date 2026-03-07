import { useTranslation } from 'react-i18next';
import { TrashIcon } from '@heroicons/react/24/outline';
import { useModal } from '../../context/useModal';

interface ClearDataButtonProps {
  onClear: () => void;
}

export default function ClearDataButton({ onClear }: ClearDataButtonProps) {
  const { t } = useTranslation();
  const { openModal } = useModal();

  function handleClick() {
    openModal({
      type: 'confirm',
      title: t('clearData.title'),
      message: t('clearData.message'),
      confirmLabel: t('clearData.confirm'),
      onConfirm: onClear,
    });
  }

  return (
    <button
      type="button"
      className="btn-action btn-action--danger"
      onClick={handleClick}
      title={t('clearData.buttonTitle')}
      aria-label={t('clearData.buttonTitle')}
    >
      <TrashIcon aria-hidden="true" />
      <span className="toolbar-label">{t('clearData.buttonLabel')}</span>
    </button>
  );
}
