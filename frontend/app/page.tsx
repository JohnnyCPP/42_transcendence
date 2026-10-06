'use client';

import React, { useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import BoardHeader from '@/components/board/BoardHeader';
import KanbanBoard from '@/components/board/kanbanBoard/KanbanBoard';
import { initialColumns } from '@/data/mockBoardData';
import { InfoDialog } from '@/components/ui';

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

  // Acción temporal de ejemplo mientras la creación real de tareas no existe.
  const handleOpenNewTaskModal = () => {
    setIsQuickTaskDialogOpen(true);
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
        <BoardHeader />

        {/* Tablero Kanban: renderiza columnas, tarjetas y modal de detalle. */}
        <KanbanBoard
          initialColumns={initialColumns}
          searchQuery={searchQuery}
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
