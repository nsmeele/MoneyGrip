import { useModal } from '../../context/ModalContext';

interface ClearDataButtonProps {
  onClear: () => void;
}

export default function ClearDataButton({ onClear }: ClearDataButtonProps) {
  const { openModal } = useModal();

  function handleClick() {
    openModal({
      type: 'confirm',
      title: 'Alle gegevens wissen',
      message: 'Hiermee worden alle rekeningen, je portefeuille en thema-instelling permanent verwijderd. Dit kan niet ongedaan worden gemaakt.',
      confirmLabel: 'Alles wissen',
      onConfirm: onClear,
    });
  }

  return (
    <button
      type="button"
      className="btn-action btn-action--danger"
      onClick={handleClick}
      title="Alle opgeslagen gegevens wissen"
      aria-label="Alle opgeslagen gegevens wissen"
    >
      Wis alles
    </button>
  );
}
