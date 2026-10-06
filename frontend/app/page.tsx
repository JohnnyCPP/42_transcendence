'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import BoardHeader from '@/components/board/BoardHeader';
import KanbanBoard from '@/components/board/kanbanBoard/KanbanBoard';
import { initialColumns } from '@/data/mockBoardData';
import { InfoDialog } from '@/components/ui';
import { BoardFilters, TaskPriority } from '@/types/board';

const initialBoardFilters: BoardFilters = {
  priorities: [],
  showCompletedOnly: false,
};

/**
 * Pantalla principal de trabajo.
 *
 * Esta vista representa el tablero Kanban principal y, por ahora,
 * usa datos simulados para que se pueda recorrer la interfaz sin backend.
 * La idea es que aquí se vea el layout completo: sidebar, header, título del board
 * y el tablero con sus columnas.
 */
export default function Home() {
  // El header y el tablero comparten este filtro para buscar tareas.
  const [searchQuery, setSearchQuery] = useState('');
  // Controla la apertura del sidebar en pantallas pequeñas.
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isQuickTaskDialogOpen, setIsQuickTaskDialogOpen] = useState(false);
  const [boardFilters, setBoardFilters] = useState<BoardFilters>(initialBoardFilters);

  // Acción temporal de ejemplo mientras la creación real de tareas no existe.
  const handleOpenNewTaskModal = () => {
    setIsQuickTaskDialogOpen(true);
  };

  const handleTogglePriority = (priority: TaskPriority) => {
    setBoardFilters((prev) => ({
      ...prev,
      priorities: prev.priorities.includes(priority)
        ? prev.priorities.filter((item) => item !== priority)
        : [...prev.priorities, priority],
    }));
  };

  const handleToggleCompletedOnly = () => {
    setBoardFilters((prev) => ({
      ...prev,
      showCompletedOnly: !prev.showCompletedOnly,
    }));
  };

  const handleClearFilters = () => {
    setBoardFilters(initialBoardFilters);
  };

  return (
    <>
      {/* Sidebar global: navegación principal de la aplicación. */}
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Contenedor principal del tablero. */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header reutilizable con búsqueda, menú mobile y acción rápida. */}
        <Header
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          onToggleMobileSidebar={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          onOpenNewTaskModal={handleOpenNewTaskModal}
        />

        {/* Encabezado contextual del board actual. */}
        <BoardHeader
          filters={boardFilters}
          onTogglePriority={handleTogglePriority}
          onToggleCompletedOnly={handleToggleCompletedOnly}
          onClearFilters={handleClearFilters}
        />

        {/* Tablero Kanban: renderiza columnas, tarjetas y modal de detalle. */}
        <KanbanBoard
          initialColumns={initialColumns}
          searchQuery={searchQuery}
          filters={boardFilters}
        />
      </main>

      <InfoDialog
        isOpen={isQuickTaskDialogOpen}
        title="Crear tarea rápida"
        description="De momento, crea nuevas tareas desde el botón + de cada columna para mantener el flujo dentro del tablero."
        onClose={() => setIsQuickTaskDialogOpen(false)}
      />
    </>
  );
}
