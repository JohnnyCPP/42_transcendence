/**
 * Props del header global de la aplicación.
 */
export interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onToggleMobileSidebar: () => void;
  onOpenNewTaskModal?: () => void;
}
