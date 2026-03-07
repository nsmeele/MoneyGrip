import { InformationCircleIcon } from '@heroicons/react/24/outline';

interface InfoPopoverProps {
  label: string;
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
}

export default function InfoPopover({ label, children, onClick }: InfoPopoverProps) {
  return (
    <span className="popover-anchor" tabIndex={0} role="button" aria-label={label} onClick={onClick}>
      <InformationCircleIcon className="popover-anchor__icon" aria-hidden="true" />
      <span className="popover-anchor__content">{children}</span>
    </span>
  );
}
