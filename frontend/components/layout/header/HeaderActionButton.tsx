// Botón genérico para acciones del header.
export function HeaderActionButton({
	icon,
	label,
	onClick,
	className = '',
  }: {
	icon: string;
	label: string;
	onClick: () => void;
	className?: string;
  }) {
	return (
	  <button
		onClick={onClick}
		className={`flex items-center gap-2 transition-colors cursor-pointer ${className}`}
	  >
		<span className="material-symbols-outlined text-[18px]">{icon}</span>
		{label}
	  </button>
	);
}