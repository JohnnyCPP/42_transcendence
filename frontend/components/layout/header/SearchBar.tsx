// Campo de búsqueda global compartido entre vistas principales.
export function SearchBar({ value, onChange }: { value: string; onChange: (query: string) => void }) {
	return (
	  <div className="flex-1 max-w-md relative group">
		<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline group-focus-within:text-primary transition-colors">
		  search
		</span>
		<input
		  type="text"
		  value={value}
		  onChange={(event) => onChange(event.target.value)}
		  placeholder="Buscar tareas y tableros..."
		  className="w-full bg-surface-container-lowest border border-outline-variant rounded-md pl-10 pr-4 py-1.5 text-[14px] text-on-surface placeholder-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
		/>
	  </div>
	);
  }