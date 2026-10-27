'use client';

import {
  HeaderActionButton,
  HeaderProps,
  MobileMenuButton,
  NotificationButton,
  ProfileMenu,
  SearchBar,
} from './header/';

/**
 * Header reutilizable en la aplicación.
 *
 * Reúne búsqueda, acceso rápido a nueva tarea, notificaciones y perfil.
 * El mismo componente se usa tanto en el dashboard como en el tablero.
 */
export default function Header({
  searchQuery,
  onSearchChange,
  onToggleMobileSidebar,
  onOpenNewTaskModal,
}: HeaderProps) {
  return (
    <header className="h-16 w-full sticky top-0 z-40 bg-surface-bright border-b border-outline-variant flex justify-between items-center px-6 shrink-0 shadow-xs">
      <MobileMenuButton onClick={onToggleMobileSidebar} />

      <SearchBar value={searchQuery} onChange={onSearchChange} />

      <div className="flex items-center gap-4 ml-auto">
        <NotificationButton />

        <HeaderActionButton
          icon="add"
          label="Nueva tarea"
          onClick={onOpenNewTaskModal ?? (() => {})}
          className="hidden md:flex border border-primary text-primary px-3 py-1.5 rounded font-semibold text-[12px] hover:bg-primary/5"
        />

        <ProfileMenu />
      </div>
    </header>
  );
}
