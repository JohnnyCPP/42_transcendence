import { Icon } from '@/components/ui';

interface HeaderButtonProps {
  icon: string;
  label: string;
  onClick: () => void;
  active?: boolean;
}

/**
 * Botón compacto de la cabecera del board (Filtros, Compartir…).
 */
export function HeaderButton({
  icon,
  label,
  onClick,
  active = false,
}: HeaderButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-1.5 rounded px-3 py-1.5 text-[12px] font-semibold transition-colors ${
        active
          ? 'bg-primary/10 text-primary'
          : 'bg-surface-container text-on-surface hover:bg-surface-container-high'
      }`}
    >
      <Icon name={icon} size="md" />
      {label}
    </button>
  );
}
