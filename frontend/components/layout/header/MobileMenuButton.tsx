// Botón compacto para abrir la navegación lateral en mobile.
export function MobileMenuButton({ onClick }: { onClick: () => void }) {
	return (
	  <button
		onClick={onClick}
		className="md:hidden mr-4 text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
		aria-label="Abrir menú de navegación"
	  >
		<span className="material-symbols-outlined">menu</span>
	  </button>
	);
}