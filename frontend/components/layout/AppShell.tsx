'use client';

import { useState, type ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

/**
 * Props del marco de la aplicación autenticada.
 */
interface AppShellProps {
  children: ReactNode;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onOpenNewTaskModal?: () => void;
}

/**
 * Shell compartido: Sidebar + Header + contenido de página.
 *
 * Evita repetir el marco en dashboard, boards y kanban.
 */
export function AppShell({
  children,
  searchQuery,
  onSearchChange,
  onOpenNewTaskModal,
}: AppShellProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <>
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          onToggleMobileSidebar={() =>
            setIsMobileSidebarOpen((open) => !open)
          }
          onOpenNewTaskModal={onOpenNewTaskModal}
        />
        {children}
      </main>
    </>
  );
}
