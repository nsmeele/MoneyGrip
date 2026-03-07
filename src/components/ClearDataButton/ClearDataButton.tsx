import { useTranslation } from 'react-i18next';
import { useModal } from '../../context/ModalContext';

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
      {t('clearData.buttonLabel')}
    </button>
  );
}
